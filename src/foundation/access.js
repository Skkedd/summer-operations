export function selectActiveOrganization(organizations, requestedId, storedId) {
  const candidates = [requestedId, storedId]
  for (const id of candidates) {
    const match = organizations.find((org) => String(org.id) === String(id))
    if (match) return match
  }
  return organizations.find((org) => org.isDefault) || organizations[0] || null
}

// Organization entitlement is always the upper bound. User rows can refine
// access/role in that organization, including an explicit deny.
export function resolveModuleAccess({ organizationId, memberships, organizationModules, userAccess, modules, isPlatformOwner = false }) {
  if (!organizationId) return []
  const membership = memberships.find((row) =>
    String(row.organization_id) === String(organizationId) && row.status === 'active')
  if (!membership && !isPlatformOwner) return []

  const owned = new Set(organizationModules.filter((row) =>
    String(row.organization_id) === String(organizationId) && row.enabled === true)
    .map((row) => row.module_key))
  const overrides = new Map(userAccess.filter((row) =>
    String(row.organization_id) === String(organizationId))
    .map((row) => [row.module_key, row]))

  return modules.filter((module) => module.status === 'active' && owned.has(module.key))
    .filter((module) => overrides.get(module.key)?.enabled !== false)
    .map((module) => {
      const override = overrides.get(module.key)
      return {
        ...module,
        role: override?.role || (isPlatformOwner ? 'platform_owner' : membership?.platform_role || 'staff'),
        organizationId,
        accessSource: override ? 'user' : 'organization',
      }
    })
}

export function hasModuleAccess(accessibleModules, moduleKey) {
  return accessibleModules.some((module) => module.key === moduleKey)
}
