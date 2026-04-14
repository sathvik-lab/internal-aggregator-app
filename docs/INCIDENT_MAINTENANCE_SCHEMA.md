# Incident + Maintenance Schema

## Collections

- `incidents`
- `maintenanceTasks`

Both collections support:
- legacy user-scoped documents (`userId`, no `businessId`)
- business-scoped documents (`userId` + optional `businessId`)

## `incidents` document schema

Required fields:
- `userId: string`
- `type: string` (must align with `INCIDENT_TYPES` in `src/constants/constants.js`)
- `severity: string` (must align with `INCIDENT_SEVERITY` in `src/constants/constants.js`)
- `title: string`
- `status: string` (recommended: `open | in_progress | resolved | closed`)
- `createdAt: string (ISO timestamp)`
- `updatedAt: string (ISO timestamp)`

Optional fields:
- `businessId: string | null`
- `description: string | null`
- `occurredAt: string (ISO timestamp) | null`
- `reportedByUserId: string | null`
- `assignedToUserId: string | null`
- `location: string | null`
- `notes: string | null`
- `mediaLogId: string | null`

Type values:
- `INCIDENT_TYPES.FOOD_SAFETY`
- `INCIDENT_TYPES.EQUIPMENT_FAILURE`
- `INCIDENT_TYPES.INJURY_ACCIDENT`
- `INCIDENT_TYPES.OTHER`

Severity values:
- `INCIDENT_SEVERITY.MINOR`
- `INCIDENT_SEVERITY.MODERATE`
- `INCIDENT_SEVERITY.SEVERE`

## `maintenanceTasks` document schema

Required fields:
- `userId: string`
- `title: string`
- `status: string` (recommended: `pending | in_progress | completed | blocked`)
- `dueDate: string (ISO timestamp | date string)`
- `createdAt: string (ISO timestamp)`
- `updatedAt: string (ISO timestamp)`

Optional fields:
- `businessId: string | null`
- `description: string | null`
- `priority: string | null` (recommended: `low | medium | high | critical`)
- `assigneeUserId: string | null`
- `incidentId: string | null` (reference to `incidents/{incidentId}`)
- `completedAt: string (ISO timestamp) | null`
- `completedByUserId: string | null`
- `notes: string | null`

## Security model

Rules enforce:
- legacy records (no `businessId`): only owning `userId` can CRUD
- business records (`businessId` present):
  - business members can read
  - owner + staff can create/update/delete

No open-world read access is allowed.

## Suggested query patterns

Common filters:
- incidents by `userId + status`
- incidents by `businessId + status`
- incidents by `businessId + severity + createdAt desc`
- maintenance tasks by `userId + status + dueDate`
- maintenance tasks by `businessId + status + dueDate`
- maintenance tasks by `businessId + assigneeUserId + status`
