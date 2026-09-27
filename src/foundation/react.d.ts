import type { ReactNode } from 'react'
import type { ModuleKey } from './types.js'

export function FleetEntryGate(props: {
  client: unknown
  moduleKey: ModuleKey
  assignmentMode?: 'compatibility' | 'explicit'
  currentArtifact?: import('./types.js').ArtifactReference | null
  showOverlay?: boolean
  children: ReactNode
}): ReactNode
