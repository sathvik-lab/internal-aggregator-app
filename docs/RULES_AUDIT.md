# Firestore and Storage rules audit

Audit date: 2026-04-15. Scope: `src/services/**` collection names and Storage object prefixes vs `firestore.rules` and `storage.rules`.

## Tenant model (rules + client)

- **Legacy rows:** `businessId == null` (or absent). Access tied to **`resource.data.userId == request.auth.uid`** (or same on create). Single-user / pre-default-business data.
- **Business rows:** `businessId != null`. **Read:** `isMemberOf(businessId)` (member doc at `businessMembers/{businessId}/members/{uid}`). **Write:** varies by collection — `isBusinessOwner`, `canWriteBusinessChecklist`, or `canWriteBusinessOperations` (see `firestore.rules` and `docs/ROLE_MATRIX.md`).

Header comments in `firestore.rules` document this split; per-`match` comments name the owning services.

## Firestore: services → collections → rules

| Collection / path | Primary services | Rules block |
| --- | --- | --- |
| `users` | `userProfile`, `checklistTemplateSync`, `pushNotifications` | `match /users/{userId}` |
| `users/{uid}/preferences/**` | `userPreferences` | nested under `users` |
| `businesses` | `userProfile`, `businessMembers` | `match /businesses/{businessId}` |
| `businessMembers/{bid}/members` | `businessMembers`, `userProfile` | `match /businessMembers/.../members` |
| `businessMembers/{bid}/inviteCodes` | `businessMembers` | `match /businessMembers/.../inviteCodes` |
| `documents` | `dashboard` (+ UI via `firestore` service) | `match /documents/{documentId}` — legacy + business |
| `checklistItems` | `dashboard`, `checklistScheduling`, `checklistInstanceSync`, `checklistItems` | `match /checklistItems/{itemId}` — legacy + business |
| `checklistTemplates` | `checklistTemplateSync`, `checklistScheduling` | `match /checklistTemplates` — read-only client |
| `mediaLogs` | `mediaLogs`, `dashboard` | `match /mediaLogs/{logId}` — legacy + business |
| `incidents` | `incidents`, `dashboard` | `match /incidents/{incidentId}` — legacy + business |
| `maintenanceTasks` | `maintenanceTasks`, `dashboard` | `match /maintenanceTasks/{taskId}` — legacy + business |

No extra top-level collections from this pass required new rule blocks. Default deny covers anything not listed.

### Client implementation note (not a rules change)

`businessMembers.js` passes paths like `` `businessMembers/${id}/members` `` into `queryDocuments` / `createDocument` / `getDocument` as a single `collectionName` string. The modular API expects **alternating** collection/document segments (e.g. `doc(db, 'businessMembers', id, 'members', uid)`). If member list or invite writes fail with invalid path errors, refactor `firestore.js` helpers to accept segment arrays or detect nested paths. Security rules already match the intended hierarchy.

## Storage: constants / usage → rules

Paths align with `STORAGE_PATHS` in `src/constants/constants.js`.

| Prefix | Writers (representative) | Rules `match` |
| --- | --- | --- |
| `user_documents/{category}/...` | Upload flow + `documentTypes` | `/user_documents/{category}/{userId}/{fileName}` |
| `user_profiles/...` | `EditProfileModal` | `/user_profiles/{userId}/{fileName}` |
| `checklist_photos/...` | Checklist UI | `/checklist_photos/{userId}/{fileName}` |
| `incident_photos/...` | `incidents.js`, `maintenanceTasks.js` | `/incident_photos/{userId}/{fileName}` |
| `certifications/...` | reserved | `/certifications/{userId}/{fileName}` |
| `media_logs/...` | `mediaLogs.js` | `/media_logs/{userId}/{fileName}` |

All matched rules require **`request.auth.uid == userId`** for the path segment (no broadening).

## Mismatch fixed (this audit)

- **Issue:** `incidents.js` / `maintenanceTasks.js` can set `contentType` to video (e.g. `video/mp4`) under `incident_photos/{userId}/...`, but `storage.rules` previously allowed only `image/.*` and 5MB.
- **Change:** Same path now allows **`image/.*` and `video/.*`**, **20MB** cap (aligned with `media_logs`), still **owner-only** on `userId`. Auth not weakened — only content type/size aligned with client.

## Maintenance

When adding a new Firestore collection or Storage prefix from `src/services/`, update **both** the service/constants and the corresponding rules file, and extend this doc or the PR description with a one-line mapping.
