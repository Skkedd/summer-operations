import { defineModuleManifest } from './foundation/contracts'

export const summerManifest = defineModuleManifest({
  key: 'summer_ops',
  name: 'Summer Operations',
  path: '/summer',
  // Prototype objects are not authoritative fleet artifacts.
  artifactTypes: [],
  eventKinds: [],
})
