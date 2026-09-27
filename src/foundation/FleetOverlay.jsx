import { useEffect, useMemo, useState } from 'react'
import { isArtifactReference } from './contracts.js'
import { moduleUrl, platformHomeUrl } from './navigation.js'
import { canDraftJournalFromMessage, createFleetEvent, fleetArtifactLabel, fleetArtifactUrl,
  fleetTargetUrl, loadFleetSnapshot, makeMessageToAppAction,
  markFleetAttentionRead, markFleetMessageRead, sendFleetMessage,
  setFleetReminderState } from './fleet-data.js'
import './FleetOverlay.css'

const VIEWS = new Set(['home', 'messages', 'attention', 'calendar', 'account'])
const empty = { messages: [], attention: [], events: [], recipients: [] }
const when = value => new Date(value).toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const localDay = value => {
  const date = new Date(value)
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function initialView() {
  try {
    const view = new URLSearchParams(globalThis.location?.search).get('fleet')
    return VIEWS.has(view) ? view : 'home'
  } catch { return 'home' }
}

export function FleetOverlay({ client, organization, user, modules = [], onSignOut,
  currentArtifact = null, startView = null, onDraftFromMessage = null }) {
  const firstView = VIEWS.has(startView) ? startView : initialView()
  const [open, setOpen] = useState(() => firstView !== 'home')
  const [view, setView] = useState(firstView)
  const [snapshot, setSnapshot] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [body, setBody] = useState('')
  const [attachCurrent, setAttachCurrent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventStart, setEventStart] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [eventVisibility, setEventVisibility] = useState('personal')
  const [eventKind, setEventKind] = useState('reminder')
  const [attachEventArtifact, setAttachEventArtifact] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => localDay(new Date()).slice(0, 7))
  const [selectedDay, setSelectedDay] = useState(() => localDay(new Date()))

  useEffect(() => {
    if (!organization?.id || !user?.id) return undefined
    let live = true
    const reload = () => {
      if (document.hidden) return
      loadFleetSnapshot(client, organization.id, calendarMonth).then(data => {
        if (live) { setSnapshot(data); setError(''); setLoading(false) }
      }).catch(cause => {
        if (live) { setError(cause.message || 'Fleet data could not be loaded.'); setLoading(false) }
      })
    }
    reload()
    const timer = window.setInterval(reload, 60000)
    document.addEventListener('visibilitychange', reload)
    return () => {
      live = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', reload)
    }
  }, [client, open, organization?.id, user?.id, calendarMonth])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const unreadMessages = snapshot.messages.filter(message =>
    message.recipient_id === user?.id && !message.read_at).length
  const unreadAttention = snapshot.attention.filter(item => !item.read_at).length
  const conversation = useMemo(() => snapshot.messages.filter(message =>
    message.sender_id === recipientId || message.recipient_id === recipientId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  [snapshot.messages, recipientId])
  const dueReminders = snapshot.events.filter(event => event.kind === 'reminder' &&
    !event.completed_at && !event.dismissed_at && new Date(event.start_at) <= new Date())
  const monthlyEvents = snapshot.events.filter(event =>
    localDay(event.start_at).slice(0, 7) === calendarMonth)
  const [year, month] = calendarMonth.split('-').map(Number)
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayEvents = monthlyEvents.filter(event => localDay(event.start_at) === selectedDay)
  const canAttach = Boolean(currentArtifact && isArtifactReference(currentArtifact) &&
    currentArtifact.organizationId === organization?.id)

  async function refresh() {
    setSnapshot(await loadFleetSnapshot(client, organization.id, calendarMonth))
  }

  async function perform(action) {
    setBusy(true)
    setError('')
    try { await action(); await refresh() }
    catch (cause) { setError(cause.message || 'Action failed.') }
    finally { setBusy(false) }
  }

  function openPanel(nextView = 'home') {
    setView(nextView)
    setLoading(true)
    setOpen(true)
  }

  async function send(event) {
    event.preventDefault()
    await perform(async () => {
      await sendFleetMessage(client, { organizationId: organization.id,
        senderId: user.id, recipientId, body,
        artifact: attachCurrent && canAttach ? currentArtifact : null })
      setBody('')
      setAttachCurrent(false)
    })
  }

  async function addEvent(event) {
    event.preventDefault()
    await perform(async () => {
      await createFleetEvent(client, { organizationId: organization.id,
        ownerId: user.id, title: eventTitle, startAt: eventStart,
        endAt: eventKind === 'reminder' ? eventStart : eventEnd,
        visibility: eventVisibility, kind: eventKind,
        artifact: attachEventArtifact && canAttach ? currentArtifact : null })
      setEventTitle(''); setEventStart(''); setEventEnd('')
      setAttachEventArtifact(false)
    })
  }

  return <div className="fleet-root">
    <button type="button" className="fleet-control" aria-label="Open Deep Site fleet"
      aria-expanded={open} onClick={() => open ? setOpen(false) : openPanel()}>
      <span className="fleet-mark">DS</span><span>Deep Site</span>
      {unreadAttention + dueReminders.length > 0 && <span className="fleet-count">{unreadAttention + dueReminders.length}</span>}
    </button>
    {open && <div className="fleet-panel" role="dialog" aria-modal="false"
      aria-label="Deep Site fleet overlay">
      <header className="fleet-header">
        <div><strong>Deep Site</strong><small>{organization?.name || 'Organization'}</small></div>
        <button type="button" aria-label="Close fleet overlay" onClick={() => setOpen(false)}>×</button>
      </header>
      <nav className="fleet-tabs" aria-label="Fleet sections">
        {['home', 'messages', 'attention', 'calendar', 'account'].map(tab =>
          <button key={tab} type="button" aria-current={view === tab ? 'page' : undefined}
            onClick={() => setView(tab)}>{tab === 'attention' ? 'Updates' : tab}</button>)}
      </nav>
      <div className="fleet-content">
        {error && <p role="alert" className="fleet-error">{error}</p>}
        {loading && <p role="status">Loading fleet activity…</p>}
        {view === 'home' && <>
          <h2>Organization Home</h2>
          <p>People, apps, and activity for {organization?.name}.</p>
          <a className="fleet-primary" href={platformHomeUrl()}>Open Organization Home</a>
          <h3>Apps</h3>
          <div className="fleet-apps">{modules.map(module =>
            <a key={module.key} href={moduleUrl(module.key)}>{module.name || module.key}</a>)}</div>
          <div className="fleet-summary">
            <button type="button" onClick={() => setView('messages')}>{unreadMessages} unread messages</button>
            <button type="button" onClick={() => setView('attention')}>{unreadAttention} new updates</button>
            <button type="button" onClick={() => setView('calendar')}>{snapshot.events.length} calendar items · {dueReminders.length} due</button>
          </div>
          <h3>Current artifact</h3>
          <p>{canAttach ? currentArtifact.title : 'No shareable artifact on this screen.'}</p>
        </>}
        {view === 'messages' && <>
          <h2>Messages</h2>
          <label>Colleague
            <select value={recipientId} onChange={event => setRecipientId(event.target.value)}>
              <option value="">Choose a colleague</option>
              {snapshot.recipients.map(person =>
                <option key={person.user_id} value={person.user_id}>{person.email}</option>)}
            </select>
          </label>
          <div className="fleet-list" aria-live="polite">
            {recipientId && conversation.length === 0 && <p>No messages yet.</p>}
            {conversation.map(message => <article key={message.id} className="fleet-item">
              <small>{message.sender_id === user.id ? 'You' : 'Colleague'} · {when(message.created_at)}</small>
              <p>{message.body}</p>
              {message.artifact_ref && <div className="fleet-artifact-card">
                <strong>{fleetArtifactLabel(message.artifact_ref)}</strong>
                <small>Shared from {message.artifact_ref.sourceModule}. The owning app checks current access.</small>
                <a href={fleetArtifactUrl(message.artifact_ref) ||
                  moduleUrl(message.artifact_ref.sourceModule)}>
                  {fleetArtifactUrl(message.artifact_ref) ? 'Open artifact' : 'Open owning app'}
                </a>
              </div>}
              {message.recipient_id === user.id && !message.read_at &&
                <button type="button" disabled={busy} onClick={() => void perform(() =>
                  markFleetMessageRead(client, message.id))}>Mark read</button>}
              {message.recipient_id === user.id && onDraftFromMessage &&
                canDraftJournalFromMessage(message) &&
                <button type="button" onClick={() => {
                  onDraftFromMessage(makeMessageToAppAction(message, organization.id,
                    user.id, 'journal', 'create_entry_draft'))
                  setOpen(false)
                }}>Draft in Journal</button>}
            </article>)}
          </div>
          <form onSubmit={send} className="fleet-form">
            <label>Message<textarea value={body} maxLength={4000}
              onChange={event => setBody(event.target.value)} /></label>
            {canAttach && <label className="fleet-inline"><input type="checkbox"
              checked={attachCurrent} onChange={event => setAttachCurrent(event.target.checked)} />
              Attach current artifact reference</label>}
            <button type="submit" disabled={busy || !recipientId || !body.trim()}>Send message</button>
          </form>
        </>}
        {view === 'attention' && <>
          <h2>Updates</h2>
          <div className="fleet-list">{snapshot.attention.length === 0 && <p>No updates yet.</p>}
            {snapshot.attention.map(item => <article key={item.id} className="fleet-item">
              <small>{item.source_module} · {when(item.created_at)}</small>
              <p>{item.title}</p>
              {item.artifact_ref && <p><a href={fleetArtifactUrl(item.artifact_ref) ||
                moduleUrl(item.artifact_ref.sourceModule)}>
                Open {fleetArtifactLabel(item.artifact_ref)}</a></p>}
              {fleetTargetUrl(item.target_path) &&
                <a href={fleetTargetUrl(item.target_path)}>Open</a>}
              {!item.read_at && <button type="button" disabled={busy}
                onClick={() => void perform(() => markFleetAttentionRead(client, item.id))}>Mark read</button>}
            </article>)}</div>
        </>}
        {view === 'calendar' && <>
          <h2>Calendar and reminders</h2>
          <h3>Due reminders</h3>
          <div className="fleet-list">{dueReminders.length === 0 && <p>Nothing due.</p>}
            {dueReminders.map(item => <article key={item.id} className="fleet-item">
              <small>Due {when(item.start_at)}</small><p>{item.title}</p>
              {item.artifact_ref && <a href={fleetArtifactUrl(item.artifact_ref) ||
                moduleUrl(item.artifact_ref.sourceModule)}>Open related artifact</a>}
              {item.owner_id === user?.id && <div className="fleet-reminder-actions">
                <button type="button" disabled={busy} onClick={() => void perform(() =>
                  setFleetReminderState(client, item.id, 'complete'))}>Complete</button>
                <button type="button" disabled={busy} onClick={() => void perform(() =>
                  setFleetReminderState(client, item.id, 'dismiss'))}>Dismiss</button>
              </div>}
            </article>)}</div>
          <label>Calendar month<input type="month" value={calendarMonth}
            onChange={event => {
              setCalendarMonth(event.target.value)
              setSelectedDay(`${event.target.value}-01`)
            }} /></label>
          <div className="fleet-calendar-grid" aria-label={`${calendarMonth} calendar`}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day =>
              <strong key={day}>{day}</strong>)}
            {Array.from({ length: firstWeekday }, (_, index) =>
              <span key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = `${calendarMonth}-${String(index + 1).padStart(2, '0')}`
              const count = monthlyEvents.filter(item => localDay(item.start_at) === day).length
              return <button key={day} type="button" aria-label={`${day}, ${count} events`}
                aria-pressed={selectedDay === day} onClick={() => setSelectedDay(day)}>
                {index + 1}{count > 0 && <small>· {count}</small>}
              </button>
            })}
          </div>
          <h3>{selectedDay} · {dayEvents.length} events</h3>
          <div className="fleet-list">{dayEvents.length === 0 && <p>No events this day.</p>}
            {dayEvents.map(event => <article key={event.id} className="fleet-item">
              <small>{when(event.start_at)} · {event.source_module}</small>
              <p>{event.title}</p>
              {event.kind === 'reminder' && <p>Reminder · {new Date(event.start_at) < new Date() ?
                'Due' : 'Upcoming'}</p>}
              {event.artifact_ref && <a href={fleetArtifactUrl(event.artifact_ref) ||
                moduleUrl(event.artifact_ref.sourceModule)}>
                Open {fleetArtifactLabel(event.artifact_ref)}</a>}
              {fleetTargetUrl(event.target_path) &&
                <a href={fleetTargetUrl(event.target_path)}>Open source</a>}
              {event.kind === 'reminder' && event.owner_id === user?.id &&
                !event.completed_at && !event.dismissed_at && <div className="fleet-reminder-actions">
                  <button type="button" disabled={busy} onClick={() => void perform(() =>
                    setFleetReminderState(client, event.id, 'complete'))}>Complete</button>
                  <button type="button" disabled={busy} onClick={() => void perform(() =>
                    setFleetReminderState(client, event.id, 'dismiss'))}>Dismiss</button>
                </div>}
            </article>)}</div>
          <h3>Upcoming this month</h3>
          <div className="fleet-list">{monthlyEvents.length === 0 && <p>No events this month.</p>}
            {monthlyEvents.map(event => <article key={event.id} className="fleet-item">
              <small>{when(event.start_at)} · {event.source_module} · {event.visibility}</small>
              <p>{event.title}</p>
              {event.artifact_ref && <a href={fleetArtifactUrl(event.artifact_ref) ||
                moduleUrl(event.artifact_ref.sourceModule)}>
                Open {fleetArtifactLabel(event.artifact_ref)}</a>}
              {fleetTargetUrl(event.target_path) &&
                <a href={fleetTargetUrl(event.target_path)}>Open source</a>}
              {event.kind === 'reminder' && event.owner_id === user?.id &&
                !event.completed_at && !event.dismissed_at && <div className="fleet-reminder-actions">
                  <button type="button" disabled={busy} onClick={() => void perform(() =>
                    setFleetReminderState(client, event.id, 'complete'))}>Complete</button>
                  <button type="button" disabled={busy} onClick={() => void perform(() =>
                    setFleetReminderState(client, event.id, 'dismiss'))}>Dismiss</button>
                </div>}
            </article>)}</div>
          <h3>Add to calendar</h3>
          <form onSubmit={addEvent} className="fleet-form">
            <label>Type<select value={eventKind} onChange={event => setEventKind(event.target.value)}>
              <option value="reminder">Reminder</option><option value="event">Event</option>
            </select></label>
            <label>Title<input value={eventTitle} maxLength={160}
              onChange={event => setEventTitle(event.target.value)} /></label>
            <label>{eventKind === 'reminder' ? 'Due' : 'Start'}<input type="datetime-local"
              value={eventStart} onChange={event => setEventStart(event.target.value)} /></label>
            {eventKind === 'event' && <label>End<input type="datetime-local" value={eventEnd}
              onChange={event => setEventEnd(event.target.value)} /></label>}
            {organization?.role === 'org_admin' && <label>Visibility
              <select value={eventVisibility} onChange={event => setEventVisibility(event.target.value)}>
                <option value="personal">Only me</option><option value="organization">Organization</option>
              </select></label>}
            {canAttach && <label className="fleet-inline"><input type="checkbox"
              checked={attachEventArtifact}
              onChange={event => setAttachEventArtifact(event.target.checked)} />
              Link current artifact</label>}
            <button type="submit" disabled={busy || !eventTitle || !eventStart ||
              (eventKind === 'event' && !eventEnd)}>
              Add {eventKind}</button>
          </form>
        </>}
        {view === 'account' && <>
          <h2>Account</h2>
          <p>{user?.email}</p>
          <p>Organization: {organization?.name}</p>
          <p>Role: {organization?.role || 'member'}</p>
          <button type="button" onClick={() => void onSignOut?.()}>Sign out</button>
        </>}
      </div>
    </div>}
  </div>
}
