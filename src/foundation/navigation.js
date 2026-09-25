export const PLATFORM_ORIGIN = 'https://app.deepsitecontrol.com'
export const PLATFORM_HOME = `${PLATFORM_ORIGIN}/launcher`
export const PLATFORM_PREVIEW_ORIGIN = 'https://deep-site-platform.vercel.app'

export function platformOrigin(location = globalThis.location) {
  return location?.origin === PLATFORM_PREVIEW_ORIGIN ? PLATFORM_PREVIEW_ORIGIN : PLATFORM_ORIGIN
}

export function platformHomeUrl() {
  return `${platformOrigin()}/launcher`
}

export const MODULES = Object.freeze({
  platform: { key: 'platform', path: '/launcher', name: 'Deep Site Platform' },
  deep_site: { key: 'deep_site', path: '/deep-site', name: 'Deep Site Control' },
  requests: { key: 'requests', path: '/requests', name: 'Operations Requests' },
  journal: { key: 'journal', path: '/journal', name: 'Operations Journal' },
  summer_ops: { key: 'summer_ops', path: '/summer', name: 'Summer Operations' },
})

const ALLOWED_ORIGINS = new Set([
  PLATFORM_ORIGIN,
  PLATFORM_PREVIEW_ORIGIN,
  'https://operations-requests.vercel.app',
  'https://operations-journal.vercel.app',
  'https://summer-operations.vercel.app',
  'https://deep-site-control.vercel.app',
  'https://facilities-map.vercel.app',
])

export function moduleUrl(moduleKey) {
  const module = MODULES[moduleKey]
  return module ? `${platformOrigin()}${module.path}` : platformHomeUrl()
}

export function canonicalModuleEntry(moduleKey, pathname = '/', search = '', hash = '') {
  const module = MODULES[moduleKey]
  if (!module) return platformHomeUrl()
  let suffix = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/'
  if (suffix === module.path || suffix === `${module.path}/`) suffix = ''
  else if (suffix.startsWith(`${module.path}/`)) suffix = suffix.slice(module.path.length)
  else if (suffix === '/') suffix = ''
  return `${platformOrigin()}${module.path}${suffix}${search}${hash}`
}

export function safePlatformRedirect(value, fallback = platformHomeUrl()) {
  if (typeof value !== 'string' || !value || value.startsWith('//') || value.includes('\\')) return fallback
  try {
    const url = new URL(value, platformOrigin())
    if (url.protocol !== 'https:' || !ALLOWED_ORIGINS.has(url.origin) || url.username || url.password) return fallback
    return url.href
  } catch {
    return fallback
  }
}

export function loginUrl(returnUrl) {
  return `${platformOrigin()}/login?redirect=${encodeURIComponent(safePlatformRedirect(returnUrl))}`
}
