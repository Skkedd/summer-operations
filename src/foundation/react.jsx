import { useEffect, useState } from 'react'
import { moduleUrl, loginUrl, PLATFORM_HOME, PLATFORM_ORIGIN } from './navigation.js'
import { resolveFleetSession, signOutAndReturn } from './session.js'
import { FleetContext } from './react-context.js'

export function FleetEntryGate({ client, moduleKey, children }) {
  const [result, setResult] = useState({ state: 'loading' })
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null)

  useEffect(() => {
    const standaloneHosts = new Set([
      'operations-requests.vercel.app', 'operations-journal.vercel.app',
      'summer-operations.vercel.app',
    ])
    if (standaloneHosts.has(window.location.hostname) && window.location.origin !== PLATFORM_ORIGIN) {
      window.location.replace(moduleUrl(moduleKey))
      return undefined
    }

    let active = true
    async function check() {
      setResult({ state: 'loading' })
      try {
        const next = await resolveFleetSession(client, moduleKey, selectedOrganizationId)
        if (active) setResult(next)
      } catch (error) {
        if (active) setResult({ state: 'error', error })
      }
    }
    void check()
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      setTimeout(() => { if (active) void check() }, 0)
    })
    const onStorage = (event) => {
      if (event.key?.startsWith('dsc-active-org:')) {
        setSelectedOrganizationId(null)
        void check()
      }
    }
    const onFocus = () => { if (active) void check() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [client, moduleKey, selectedOrganizationId])

  if (result.state === 'authorized') {
    return <FleetContext.Provider value={result}>{children}</FleetContext.Provider>
  }
  if (result.state === 'loading') return <div role="status">Checking Deep Site access…</div>
  if (result.state === 'unauthenticated') {
    window.location.replace(loginUrl(moduleUrl(moduleKey)))
    return null
  }
  if (result.state === 'choose_organization') {
    return <main><h1>Choose an organization</h1><p>Select the organization for this app.</p>
      {result.organizations.map((org) => <button key={org.id} type="button"
        onClick={() => setSelectedOrganizationId(org.id)}>{org.name}</button>)}</main>
  }
  return <main role="alert"><h1>App access unavailable</h1>
    <p>{result.state === 'forbidden' ? 'This app is not enabled for your current organization.' :
      result.state === 'no_organization' ? 'Your account is not assigned to an organization.' :
        'Your access could not be verified. Please try again.'}</p>
    <a href={PLATFORM_HOME}>Organization Home</a>
    <button type="button" onClick={() => void signOutAndReturn(client)}>Sign out</button>
  </main>
}
