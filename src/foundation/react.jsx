import { useEffect, useState } from 'react'
import { canonicalModuleEntry, moduleUrl, loginUrl, safePlatformRedirect, platformHomeUrl, PLATFORM_ORIGIN } from './navigation.js'
import { resolveFleetSession, signOutAndReturn } from './session.js'
import { FleetContext } from './react-context.js'
import { FleetOverlay } from './FleetOverlay.jsx'

export function FleetEntryGate({ client, moduleKey, assignmentMode = 'compatibility',
  currentArtifact = null, showOverlay = true, children }) {
  const [result, setResult] = useState({ state: 'loading' })
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null)

  useEffect(() => {
    const standaloneHosts = new Set([
      'operations-requests.vercel.app', 'operations-journal.vercel.app',
      'summer-operations.vercel.app',
    ])
    if (standaloneHosts.has(window.location.hostname) && window.location.origin !== PLATFORM_ORIGIN) {
      window.location.replace(canonicalModuleEntry(moduleKey,
        window.location.pathname, window.location.search, window.location.hash))
      return undefined
    }

    let active = true
    let checkId = 0
    async function check() {
      const currentCheckId = ++checkId
      setResult({ state: 'loading' })
      try {
        const next = await resolveFleetSession(client, moduleKey, selectedOrganizationId,
          { assignmentMode })
        if (active && currentCheckId === checkId) setResult(next)
      } catch (error) {
        if (active && currentCheckId === checkId) setResult({ state: 'error', error })
      }
    }
    void check()
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      // Hide the previous actor's authorized view before the next access check starts.
      checkId += 1
      setResult({ state: 'loading' })
      setTimeout(() => { if (active) void check() }, 0)
    })
    const onStorage = (event) => {
      if (event.key?.startsWith('dsc-active-org:')) {
        if (selectedOrganizationId) {
          checkId += 1
          setResult({ state: 'loading' })
          setSelectedOrganizationId(null)
        }
        else void check()
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
  }, [client, moduleKey, assignmentMode, selectedOrganizationId])

  useEffect(() => {
    if (result.state === 'unauthenticated') {
      window.location.replace(loginUrl(safePlatformRedirect(window.location.href, moduleUrl(moduleKey))))
    }
  }, [result.state, moduleKey])

  if (result.state === 'authorized') {
    return <FleetContext.Provider value={result}>
      {children}
      {showOverlay && <FleetOverlay key={`${result.user.id}:${result.organization.id}`} client={client}
        organization={result.organization} user={result.user}
        modules={result.modules || []}
        currentArtifact={currentArtifact}
        onSignOut={() => signOutAndReturn(client)} />}
    </FleetContext.Provider>
  }
  if (result.state === 'loading') return <div role="status">Checking Deep Site access…</div>
  if (result.state === 'unauthenticated') {
    return <div role="status">Returning to Deep Site login…</div>
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
    <a href={platformHomeUrl()}>Organization Home</a>
    <button type="button" onClick={() => void signOutAndReturn(client)}>Sign out</button>
  </main>
}
