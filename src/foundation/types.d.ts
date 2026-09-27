export type OrganizationId = string
export type UserId = string
export type ModuleKey = 'deep_site' | 'requests' | 'journal' | 'summer_ops' | (string & {})

export interface ModuleManifest {
  key: ModuleKey
  name: string
  path: string
  artifactTypes: readonly string[]
  eventKinds: readonly string[]
  roleKeys?: readonly string[]
  capabilityKeys?: readonly string[]
}

export interface OrganizationPerson {
  organizationId: OrganizationId
  userId: UserId
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  organizationRole: 'org_admin' | 'staff' | (string & {})
  siteIds: readonly string[]
  productAssignments: readonly {
    moduleKey: ModuleKey
    enabled: boolean
    moduleRole?: string
  }[]
}

export interface ModuleIdentity {
  key: ModuleKey
  name: string
  path: string
}

export interface OrganizationContext {
  id: OrganizationId
  name: string
  role: string
  isDefault: boolean
}

export interface ArtifactReference {
  version: 1
  organizationId: OrganizationId
  sourceModule: ModuleKey
  type: string
  id: string
  title: string
  summary?: string
  siteId?: string
  openUrl: string
  presentation?: { icon?: string; subtitle?: string; thumbnailUrl?: string }
  permission?: { action: 'read' | 'comment' | 'act'; policyKey?: string }
  actions?: readonly { id: string; label: string; targetModule?: ModuleKey }[]
}

export interface RestrictedArtifactGrant {
  id: string
  artifact: Pick<ArtifactReference, 'organizationId' | 'sourceModule' | 'type' | 'id'>
  recipientId: UserId
  issuedByAdminOrDelegateId: UserId
  issuedAt: string
  expiresAt?: string
  revokedAt?: string
  auditEventId: string
  // Access granted here never supplies grant or delegation authority.
}

export interface SharingDelegation {
  id: string
  organizationId: OrganizationId
  granteeId: UserId
  grantedByAdminId: UserId
  active: boolean
  artifactTypes: readonly string[]
  siteIds?: readonly string[]
  grantedAt: string
  revokedAt?: string
  // Only an admin may issue this. A delegate cannot delegate onward.
}

export interface FleetOverlayAdapter {
  module: ModuleManifest
  getCurrentArtifact(): ArtifactReference | null
  openOrganizationHome(): void
  signOut(): Promise<void>
  // The platform owns overlay rendering, messages, calendar and attention state.
}

export interface DomainEvent {
  id: string
  organizationId: OrganizationId
  sourceModule: ModuleKey
  kind: string
  occurredAt: string
  idempotencyKey: string
  actorId?: UserId
  artifact?: ArtifactReference
}

export interface AttentionItem {
  id: string
  organizationId: OrganizationId
  recipientId: UserId
  domainEventId: string
  state: 'unread' | 'read' | 'dismissed'
  dueAt?: string
}

export interface Notification {
  id: string
  attentionItemId: string
  channel: 'in_app' | 'email' | 'push'
  deliveryState: 'queued' | 'sent' | 'failed'
}

export interface Reminder {
  id: string
  organizationId: OrganizationId
  ownerId: UserId
  dueAt: string
  artifact?: ArtifactReference
  state: 'open' | 'done' | 'cancelled'
}

export interface Assignment {
  id: string
  organizationId: OrganizationId
  assigneeId: UserId
  artifact: ArtifactReference
  dueAt?: string
  state: 'open' | 'done' | 'cancelled'
}

export interface FleetMessage {
  id: string
  organizationId: OrganizationId
  conversationId: string
  senderId: UserId
  body: string
  sentAt: string
  attachments?: readonly ArtifactReference[]
}

export interface MessageToAppAction {
  messageId: string
  organizationId: OrganizationId
  recipientId: UserId
  targetModule: ModuleKey
  action: string
  sourceArtifact: Partial<ArtifactReference> | null
  // The target module validates this and creates a reviewable draft.
  execution: 'reviewable_draft'
}

export interface CalendarEvent {
  id: string
  organizationId: OrganizationId
  title: string
  startAt: string
  endAt: string
  timeZone: string
  visibility: 'organization' | 'site' | 'personal'
  sourceModule?: ModuleKey
  artifact?: ArtifactReference
  externalSync?: readonly { provider: string; externalId: string }[]
}

export interface PlatformModule {
  key: ModuleKey
  status: string
  name?: string
  route?: string
  role?: string
  organizationId?: OrganizationId
  accessSource?: 'user' | 'organization'
}

export interface FleetSessionResult {
  state: 'loading' | 'unauthenticated' | 'choose_organization' | 'no_organization' | 'forbidden' | 'authorized' | 'error'
  user?: { id: UserId; email?: string }
  organization?: OrganizationContext
  organizations?: OrganizationContext[]
  module?: PlatformModule
  modules?: PlatformModule[]
  error?: unknown
}

export interface FleetSessionOptions {
  assignmentMode?: 'compatibility' | 'explicit'
}

export const PLATFORM_ORIGIN: string
export const PLATFORM_HOME: string
export const PLATFORM_PREVIEW_ORIGIN: string
export function platformOrigin(location?: { origin?: string }): string
export function platformHomeUrl(): string
export const MODULES: Readonly<Record<string, ModuleIdentity>>
export const CONTRACT_VERSION: 1
export const FLEET_EVENTS: Readonly<Record<string, string>>
export const FLEET_OVERLAY_CAPABILITIES: readonly string[]
export function defineModuleManifest<T extends ModuleManifest>(manifest: T): Readonly<T>

export function selectActiveOrganization<T extends { id: string; isDefault?: boolean }>(organizations: T[], requestedId?: string | null, storedId?: string | null): T | null
export function requiresOrganizationChoice(organizations: { id: string }[], storedId?: string | null): boolean
export function resolveModuleAccess(input: {
  organizationId: string | null
  memberships: { organization_id: string; platform_role?: string; status: string }[]
  organizationModules: { organization_id: string; module_key: string; enabled: boolean }[]
  userAccess: { organization_id: string; module_key: string; role?: string; enabled: boolean }[]
  modules: PlatformModule[]
  isPlatformOwner?: boolean
  assignmentMode?: 'compatibility' | 'explicit'
}): PlatformModule[]
export function planAssignmentBackfill(input: {
  memberships: { organization_id: string; user_id?: string | null; status: string }[]
  organizationModules: { organization_id: string; module_key: string; enabled: boolean }[]
  userAccess: { organization_id: string; user_id: string; module_key: string; enabled: boolean }[]
}): { organization_id: string; user_id: string; module_key: string; enabled: true }[]
export function hasModuleAccess(accessibleModules: PlatformModule[], moduleKey: ModuleKey): boolean
export function moduleUrl(moduleKey: ModuleKey): string
export function canonicalModuleEntry(moduleKey: ModuleKey, pathname?: string, search?: string, hash?: string): string
export function safePlatformRedirect(value: unknown, fallback?: string | null): string | null
export function loginUrl(returnUrl: string): string
export function getStoredOrganizationId(userId: string, storage?: Pick<Storage, 'getItem'>): string | null
export function storeOrganizationId(userId: string, organizationId: string, storage?: Pick<Storage, 'setItem'>): void
export function mapOrganization(row: Record<string, unknown>): OrganizationContext | null
export function createFleetClient<T>(createClient: (url: string, anonKey: string, options: object) => T, url: string, anonKey: string): T
export function signOutAndReturn(client: { auth: { signOut(): Promise<{ error: unknown }> } }): Promise<{ ok: boolean; error?: unknown }>
export function resolveFleetSession(client: unknown, moduleKey: ModuleKey, requestedOrganizationId?: string | null, options?: FleetSessionOptions): Promise<FleetSessionResult>
export function isArtifactReference(value: unknown): value is ArtifactReference
export function opaqueArtifactReference(reference: ArtifactReference, organizationId: string): {
  version: 1; organizationId: string; sourceModule: ModuleKey; type: string; id: string; siteId?: string
}
export function fleetTargetUrl(path: unknown): string | null
export function fleetArtifactUrl(reference: Partial<ArtifactReference> | null): string | null
export function fleetArtifactLabel(reference: Partial<ArtifactReference> | null): string
export interface FleetMessageRow {
  id: string
  organization_id: OrganizationId
  sender_id: UserId
  recipient_id: UserId
  body: string
  artifact_ref: object | null
  created_at: string
  read_at: string | null
}
export interface FleetAttentionRow {
  id: string
  source_module: ModuleKey
  kind: string
  source_id: string
  title: string
  target_path: string
  artifact_ref: Partial<ArtifactReference> | null
  created_at: string
  read_at: string | null
}
export interface FleetCalendarRow {
  id: string
  owner_id: UserId
  title: string
  start_at: string
  end_at: string
  visibility: 'personal' | 'organization'
  source_module: ModuleKey
  target_path: string | null
  kind: 'event' | 'reminder' | 'product_event'
  artifact_ref: Partial<ArtifactReference> | null
  completed_at: string | null
  dismissed_at: string | null
}
export interface FleetRecipient { user_id: UserId; email: string }
export function loadFleetSnapshot(client: unknown, organizationId: OrganizationId): Promise<{
  messages: FleetMessageRow[]
  attention: FleetAttentionRow[]
  events: FleetCalendarRow[]
  recipients: FleetRecipient[]
}>
export function sendFleetMessage(client: unknown, input: {
  organizationId: OrganizationId; senderId: UserId; recipientId: UserId
  body: string; artifact?: ArtifactReference | null
}): Promise<{ id: string }>
export function markFleetMessageRead(client: unknown, id: string): Promise<boolean>
export function markFleetAttentionRead(client: unknown, id: string): Promise<boolean>
export function createFleetEvent(client: unknown, input: {
  organizationId: OrganizationId; ownerId: UserId; title: string
  startAt: string; endAt: string; visibility?: 'personal' | 'organization'
  kind?: 'event' | 'reminder'; artifact?: ArtifactReference | null
}): Promise<{ id: string }>
export function setFleetReminderState(client: unknown, id: string, state: 'complete' | 'dismiss'): Promise<boolean>
export function makeMessageToAppAction(message: FleetMessageRow, organizationId: OrganizationId,
  recipientId: UserId, targetModule: ModuleKey, action: string): Readonly<MessageToAppAction>
export function canDraftJournalFromMessage(message: FleetMessageRow): boolean
export function canDelegateSharingAuthority(actor: { role?: string } | null): boolean
export function canGrantRestrictedArtifact(input: {
  actor: { id: UserId; role: string; organizationId: OrganizationId; siteIds?: string[] }
  delegation?: { active: boolean; granteeId: UserId; organizationId: OrganizationId; grantedByAdminId: UserId; artifactTypes: string[]; siteIds?: string[]; revokedAt?: string | null }
  artifact: ArtifactReference
  recipientId: UserId
}): boolean

export interface ExternalCalendarEvent {
  provider: string
  externalId: string
  connectionId: string
  title: string
  startAt: string
  endAt: string
  timeZone: string
  sourceUrl?: string
}

export interface ExternalCalendarAdapter {
  readonly provider: string
  listWindow(input: {
    organizationId: OrganizationId
    connectionId: string
    startAt: string
    endAt: string
  }): Promise<readonly ExternalCalendarEvent[]>
}
