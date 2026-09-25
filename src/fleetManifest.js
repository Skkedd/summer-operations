import { defineModuleManifest } from './foundation/contracts'

export const summerManifest = defineModuleManifest({
  key: 'summer_ops',
  name: 'Summer Operations',
  path: '/summer',
  artifactTypes: ['project', 'task', 'schedule_item', 'site_assignment'],
  eventKinds: ['schedule.review_required', 'task.assigned'],
})
