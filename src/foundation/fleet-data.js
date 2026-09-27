import { isArtifactReference } from './contracts.js'
import { moduleUrl, platformOrigin, safePlatformRedirect } from './navigation.js'

function requireOrganization(organizationId) {
  if (typeof organizationId !== 'string' || !organizationId) {
    throw new TypeError('An active organization is required')
  }
}

function unwrap(result) {
  if (result.error) throw result.error
  return result.data
}

export function opaqueArtifactReference(reference, organizationId) {
  if (!isArtifactReference(reference) || reference.organizationId !== organizationId) {
    throw new TypeError('Artifact does not belong to the active organization')
  }
  return {
    version: 1,
    organizationId,
    sourceModule: reference.sourceModule,
    type: reference.type,
    id: reference.id,
    ...(reference.siteId ? { siteId: reference.siteId } : {}),
  }
}

export function fleetTargetUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') ||
      path.includes('\\')) return null
  return safePlatformRedirect(`${platformOrigin()}${path}`, null)
}

export function fleetArtifactUrl(reference) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!reference || !uuid.test(reference.organizationId) || !uuid.test(reference.id)) return null
  if (reference.sourceModule === 'journal' && reference.type === 'entry') {
    const query = new URLSearchParams({ fleetArtifact: 'entry', fleetId: reference.id,
      fleetOrg: reference.organizationId })
    return `${moduleUrl('journal')}?${query}`
  }
  if (reference.sourceModule === 'deep_site' && reference.type === 'site_anchor' &&
      uuid.test(reference.siteId || '')) {
    const query = new URLSearchParams({ fleetArtifact: 'site_anchor',
      fleetId: reference.id, fleetOrg: reference.organizationId,
      fleetSite: reference.siteId })
    return `${moduleUrl('deep_site')}?${query}`
  }
  return null
}

export function fleetArtifactLabel(reference) {
  const labels = {
    journal: { entry: 'Journal entry' },
    deep_site: { site_anchor: 'Deep Site location' },
  }
  return labels[reference?.sourceModule]?.[reference?.type] ||
    `${reference?.sourceModule || 'Product'} artifact`
}

export async function loadFleetSnapshot(client, organizationId) {
  requireOrganization(organizationId)
  const [messages, attention, events, reminders, recipients] = await Promise.all([
    client.from('fleet_messages').select('id,organization_id,sender_id,recipient_id,body,artifact_ref,created_at,read_at')
      .eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100),
    client.from('fleet_attention').select('id,source_module,kind,source_id,title,target_path,artifact_ref,created_at,read_at')
      .eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100),
    client.from('fleet_calendar_events').select('id,owner_id,title,start_at,end_at,visibility,source_module,target_path,kind,artifact_ref,completed_at,dismissed_at')
      .eq('organization_id', organizationId).gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true }).limit(100),
    client.from('fleet_calendar_events').select('id,owner_id,title,start_at,end_at,visibility,source_module,target_path,kind,artifact_ref,completed_at,dismissed_at')
      .eq('organization_id', organizationId).eq('kind', 'reminder')
      .is('completed_at', null).is('dismissed_at', null)
      .order('start_at', { ascending: true }).limit(100),
    client.rpc('fleet_list_recipients', { p_organization_id: organizationId }),
  ])
  const eventRows = (unwrap(events) || []).filter(row => row.kind !== 'reminder' ||
    (!row.completed_at && !row.dismissed_at))
  const reminderRows = unwrap(reminders) || []
  const visibleEvents = [...new Map([...eventRows, ...reminderRows].map(row => [row.id, row])).values()]
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
  return { messages: unwrap(messages) || [], attention: unwrap(attention) || [],
    events: visibleEvents, recipients: unwrap(recipients) || [] }
}

export async function sendFleetMessage(client, { organizationId, senderId, recipientId, body,
  artifact = null }) {
  requireOrganization(organizationId)
  const trimmed = typeof body === 'string' ? body.trim() : ''
  if (!trimmed || trimmed.length > 4000 || !senderId || !recipientId || senderId === recipientId) {
    throw new TypeError('Choose a recipient and enter a message up to 4,000 characters')
  }
  const row = { organization_id: organizationId, sender_id: senderId,
    recipient_id: recipientId, body: trimmed }
  if (artifact) row.artifact_ref = opaqueArtifactReference(artifact, organizationId)
  return unwrap(await client.from('fleet_messages').insert(row).select('id').single())
}

export async function markFleetMessageRead(client, id) {
  return unwrap(await client.rpc('mark_fleet_message_read', { p_message_id: id }))
}

export async function markFleetAttentionRead(client, id) {
  return unwrap(await client.rpc('mark_fleet_attention_read', { p_attention_id: id }))
}

export async function createFleetEvent(client, { organizationId, ownerId, title, startAt,
  endAt, visibility = 'personal', kind = 'event', artifact = null }) {
  requireOrganization(organizationId)
  const name = typeof title === 'string' ? title.trim() : ''
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (!name || name.length > 160 || !Number.isFinite(start.valueOf()) ||
      !Number.isFinite(end.valueOf()) || end < start ||
      !['personal', 'organization'].includes(visibility) ||
      !['event', 'reminder'].includes(kind)) {
    throw new TypeError('Enter a title and a valid start and end time')
  }
  const row = {
    organization_id: organizationId, owner_id: ownerId, title: name,
    start_at: start.toISOString(), end_at: end.toISOString(), visibility,
    kind,
  }
  if (artifact) row.artifact_ref = opaqueArtifactReference(artifact, organizationId)
  return unwrap(await client.from('fleet_calendar_events').insert(row).select('id').single())
}

export async function setFleetReminderState(client, id, state) {
  if (!id || !['complete', 'dismiss'].includes(state)) throw new TypeError('Invalid reminder action')
  const changed = unwrap(await client.rpc('set_fleet_reminder_state', {
    p_event_id: id, p_state: state,
  }))
  if (!changed) throw new Error('Reminder is unavailable or access has changed')
  return changed
}

export function makeMessageToAppAction(message, organizationId, recipientId,
  targetModule, action) {
  requireOrganization(organizationId)
  if (!message?.id || message.organization_id !== organizationId ||
      message.recipient_id !== recipientId || !recipientId ||
      !targetModule || !action) {
    throw new TypeError('Message action is unavailable in this organization')
  }
  return Object.freeze({
    messageId: message.id, organizationId, recipientId, targetModule, action,
    sourceArtifact: message.artifact_ref || null, execution: 'reviewable_draft',
  })
}

export function canDraftJournalFromMessage(message) {
  const artifact = message?.artifact_ref
  return !artifact || (artifact.sourceModule === 'journal' && artifact.type === 'entry')
}
