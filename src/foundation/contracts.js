import { safePlatformRedirect } from './navigation.js'

export const CONTRACT_VERSION = 1

export function isArtifactReference(value) {
  return Boolean(value && value.version === CONTRACT_VERSION &&
    typeof value.organizationId === 'string' && value.organizationId &&
    typeof value.sourceModule === 'string' && value.sourceModule &&
    typeof value.type === 'string' && value.type &&
    typeof value.id === 'string' && value.id &&
    typeof value.title === 'string' && value.title &&
    typeof value.openUrl === 'string' &&
    safePlatformRedirect(value.openUrl, null) !== null)
}

export function canDelegateSharingAuthority(actor) {
  return actor?.role === 'site_admin' || actor?.role === 'org_admin'
}

export function canGrantRestrictedArtifact({ actor, delegation, artifact, recipientId }) {
  if (!isArtifactReference(artifact) || !recipientId || actor?.organizationId !== artifact.organizationId) return false
  if (actor?.role === 'org_admin') return true
  if (actor?.role === 'site_admin' && artifact.siteId && actor.siteIds?.includes(artifact.siteId)) return true
  return Boolean(delegation?.active && delegation?.granteeId === actor?.id &&
    delegation?.organizationId === artifact.organizationId &&
    delegation?.grantedByAdminId && delegation?.scope?.includes(artifact.type) &&
    (!artifact.siteId || delegation.siteIds?.includes(artifact.siteId)))
}

export const FLEET_EVENTS = Object.freeze({
  domainEvent: 'domain_event', attentionItem: 'attention_item', notification: 'notification',
  reminder: 'reminder', assignment: 'assignment', calendarEvent: 'calendar_event', message: 'message',
})

export const FLEET_OVERLAY_CAPABILITIES = Object.freeze([
  'organization_home', 'app_switching', 'account', 'organization', 'attention',
  'messages', 'reminders', 'calendar', 'share_artifact',
])
