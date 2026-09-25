import { resolveModuleAccess, selectActiveOrganization } from './access.js'

export function getStoredOrganizationId(userId, storage = globalThis.localStorage) {
  if (!userId) return null
  try { return storage.getItem(`dsc-active-org:${userId}`) } catch { return null }
}

export function storeOrganizationId(userId, organizationId, storage = globalThis.localStorage) {
  if (!userId || !organizationId) return
  try { storage.setItem(`dsc-active-org:${userId}`, organizationId) } catch { /* convenience only */ }
}

export function mapOrganization(row) {
  if (!row?.organization_id) return null
  return {
    id: row.organization_id,
    name: row.organization_name || 'Organization',
    slug: row.organization_slug || '',
    type: row.organization_type || 'real',
    capabilities: row.organization_capabilities || {},
    role: row.member_role || 'member',
    isDefault: Boolean(row.is_default),
  }
}

export function createFleetClient(createClient, url, anonKey) {
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
}

export async function signOutAndReturn(client) {
  const { error } = await client.auth.signOut()
  if (error) return { ok: false, error }
  globalThis.location.assign('https://app.deepsitecontrol.com/')
  return { ok: true }
}

// Client entry guard improves routing and UX. Backend RLS must independently
// enforce the same organization, entitlement and user boundaries.
export async function resolveFleetSession(client, moduleKey, requestedOrganizationId) {
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData?.user) return { state: 'unauthenticated', error: userError || null }
  const user = userData.user
  const { data: orgRows, error: orgError } = await client.rpc('current_user_organizations')
  if (orgError) return { state: 'error', user, error: orgError }
  const organizations = (orgRows || []).map(mapOrganization).filter(Boolean)
  const storedId = getStoredOrganizationId(user.id)
  if (!requestedOrganizationId && !storedId && organizations.length > 1) {
    return { state: 'choose_organization', user, organizations }
  }
  const organization = selectActiveOrganization(
    organizations, requestedOrganizationId, storedId)
  if (!organization) return { state: 'no_organization', user, organizations }

  const [membershipResult, moduleResult, entitlementResult, userAccessResult] = await Promise.all([
    client.from('organization_memberships').select('organization_id,platform_role,status')
      .eq('user_id', user.id).eq('organization_id', organization.id).eq('status', 'active'),
    client.from('platform_modules').select('key,name,description,route,status,sort_order')
      .eq('key', moduleKey),
    client.from('organization_modules').select('organization_id,module_key,enabled')
      .eq('organization_id', organization.id).eq('module_key', moduleKey),
    client.from('user_module_access').select('organization_id,module_key,role,enabled')
      .eq('user_id', user.id).eq('organization_id', organization.id).eq('module_key', moduleKey),
  ])
  const error = [membershipResult, moduleResult, entitlementResult, userAccessResult]
    .find((result) => result.error)?.error
  if (error) return { state: 'error', user, organization, organizations, error }
  const modules = resolveModuleAccess({
    organizationId: organization.id,
    memberships: membershipResult.data || [],
    modules: moduleResult.data || [],
    organizationModules: entitlementResult.data || [],
    userAccess: userAccessResult.data || [],
  })
  if (!modules.some((module) => module.key === moduleKey)) {
    return { state: 'forbidden', user, organization, organizations }
  }
  storeOrganizationId(user.id, organization.id)
  return { state: 'authorized', user, organization, organizations, module: modules[0] }
}
