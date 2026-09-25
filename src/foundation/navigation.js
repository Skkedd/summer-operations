export const PLATFORM_ORIGIN = 'https://app.deepsitecontrol.com'
export const PLATFORM_HOME = `${PLATFORM_ORIGIN}/launcher`

export const MODULES = Object.freeze({
  deep_site: { key: 'deep_site', path: '/deep-site', name: 'Deep Site Control' },
  requests: { key: 'requests', path: '/requests', name: 'Operations Requests' },
  journal: { key: 'journal', path: '/journal', name: 'Operations Journal' },
  summer_ops: { key: 'summer_ops', path: '/summer', name: 'Summer Operations' },
})

const ALLOWED_ORIGINS = new Set([
  PLATFORM_ORIGIN,
  'https://operations-requests.vercel.app',
  'https://operations-journal.vercel.app',
  'https://summer-operations.vercel.app',
  'https://deep-site-control.vercel.app',
  'https://facilities-map.vercel.app',
])

export function moduleUrl(moduleKey) {
  const module = MODULES[moduleKey]
  return module ? `${PLATFORM_ORIGIN}${module.path}` : PLATFORM_HOME
}

export function safePlatformRedirect(value, fallback = PLATFORM_HOME) {
  if (typeof value !== 'string' || !value || value.startsWith('//') || value.includes('\\')) return fallback
  try {
    const url = new URL(value, PLATFORM_ORIGIN)
    if (url.protocol !== 'https:' || !ALLOWED_ORIGINS.has(url.origin) || url.username || url.password) return fallback
    return url.href
  } catch {
    return fallback
  }
}

export function loginUrl(returnUrl) {
  return `${PLATFORM_ORIGIN}/login?redirect=${encodeURIComponent(safePlatformRedirect(returnUrl))}`
}
