import type { ReactNode } from 'react'
import type { ArtifactReference, OrganizationContext, PlatformModule } from './types.js'

export function FleetOverlay(props: {
  client: unknown
  organization: OrganizationContext
  user: { id: string; email?: string }
  modules?: PlatformModule[]
  onSignOut?: () => Promise<unknown> | void
  currentArtifact?: ArtifactReference | null
  startView?: 'home' | 'messages' | 'attention' | 'calendar' | 'account' | null
  onDraftFromMessage?: ((message: import('./types.js').FleetMessageRow) => void) | null
}): ReactNode
