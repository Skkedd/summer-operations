import { createContext, useContext } from 'react'

export const FleetContext = createContext(null)
export function useFleetContext() { return useContext(FleetContext) }
