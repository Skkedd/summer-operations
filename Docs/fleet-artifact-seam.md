# Summer fleet artifact seam

Current Summer schedule and staffing views are prototype data. They do not
provide stable source-owned persistence or an authenticated organization/site
read resolver. The module manifest advertises no artifact types or event kinds
until those exist. The shared Fleet Overlay remains available.

Representative development fixture for a future provider (not a live object):

```json
{
  "organizationId": "a1000000-0000-4000-8000-000000000001",
  "sourceModule": "summer_ops",
  "type": "schedule_item",
  "id": "a9000000-0000-4000-8000-000000000001",
  "siteId": "a8000000-0000-4000-8000-000000000001",
  "title": "North campus summer coverage",
  "permission": { "action": "read", "policyKey": "schedule.read" }
}
```

Before enabling `schedule_item` in `src/fleetManifest.js`, the owning
Summer service must persist an organization and site scoped record with a
stable ID and resolve a direct link under the current signed-in user's
capability and site scope. Revoked access and deleted records must fail
closed. The provider may then issue Fleet pointers and truthful attention or
calendar events; prototype display data cannot authorize either.
