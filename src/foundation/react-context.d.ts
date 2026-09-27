import type { Context } from 'react'
import type { FleetSessionResult } from './types.js'

export const FleetContext: Context<FleetSessionResult | null>
export function useFleetContext(): FleetSessionResult | null
