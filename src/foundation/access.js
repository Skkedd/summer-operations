export function selectActiveOrganization(organizations, requestedId, storedId) {
  const candidates = [requestedId, storedId]
  for (const id of candidates) {
    const match = organizations.find((org) => String(org.id) === String(id))
    if (match) return match
  }
  return organizations.find((org) => org.isDefault) || organizations[0] || null
}

export function requiresOrganizationChoice(organizations, storedId) {
  return organizations.length > 1 &&
    (!storedId || !organizations.some((org) => String(org.id) === String(storedId)))
}

// Organization entitlement is always the upper bound. User rows can refine
// access/role in that organization, including an explicit deny.
export function resolveModuleAccess({ organizationId, memberships, organizationModules, userAccess, modules, isPlatformOwner = false, assignmentMode = 'compatibility' }) {
  if (assignmentMode !== 'compatibility' && assignmentMode !== 'explicit') {
    throw new TypeError('Unknown Deep Site assignment mode')
  }
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
    .filter((module) => isPlatformOwner ||
      (assignmentMode === 'explicit'
        ? overrides.get(module.key)?.enabled === true
        : overrides.get(module.key)?.enabled !== false))
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

// Produces a reviewable compatibility snapshot; it does not write to a
// database. Existing explicit denies are preserved, and pending invitations
// cannot receive assignments before they have a user identity.
export function planAssignmentBackfill({ memberships, organizationModules, userAccess }) {
  const existing = new Set(userAccess.map((row) =>
    `${row.organization_id}\0${row.user_id}\0${row.module_key}`))
  const enabledByOrg = new Map()
  for (const row of organizationModules) {
    if (row.enabled !== true) continue
    const keys = enabledByOrg.get(row.organization_id) || new Set()
    keys.add(row.module_key)
    enabledByOrg.set(row.organization_id, keys)
  }
  const planned = []
  for (const member of memberships) {
    if (member.status !== 'active' || !member.user_id) continue
    for (const moduleKey of enabledByOrg.get(member.organization_id) || []) {
      const id = `${member.organization_id}\0${member.user_id}\0${moduleKey}`
      if (existing.has(id)) continue
      existing.add(id)
      planned.push({ organization_id: member.organization_id,
        user_id: member.user_id, module_key: moduleKey, enabled: true })
    }
  }
  return planned.sort((a, b) =>
    a.organization_id.localeCompare(b.organization_id) ||
    a.user_id.localeCompare(b.user_id) ||
    a.module_key.localeCompare(b.module_key))
}

export function hasModuleAccess(accessibleModules, moduleKey) {
  return accessibleModules.some((module) => module.key === moduleKey)
}
