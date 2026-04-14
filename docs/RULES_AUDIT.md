# Rules Audit (`src/services/*.js`)

## Firestore collections used by services

- `users`
  - Read/write in `userProfile.js`, `checklistTemplateSync.js`
  - Subdocument read/write in `userPreferences.js` at `users/{userId}/preferences/settings`
- `documents`
  - Read in `dashboard.js`
- `checklistItems`
  - Read/write in `checklistScheduling.js`, `checklistInstanceSync.js`, `checklistItems.js`, `dashboard.js`
- `mediaLogs`
  - Read/write in `mediaLogs.js`
- `checklistTemplates`
  - Read in `checklistTemplateSync.js` (client writes denied by rules)

## Storage paths used by services

- Generic storage operations are implemented in `storage.js`
- Concrete service path in use:
  - `media_logs/{userId}/{fileName}` from `mediaLogs.js` via `STORAGE_PATHS.MEDIA_LOGS`

> Note: Additional storage roots exist in `STORAGE_PATHS` constants and are used by app features outside `src/services/*.js`.

## Rules alignment check

### Firestore (`firestore.rules`)

- `users/{userId}` + `users/{userId}/preferences/**`: owner-only read/write (aligned)
- `documents/{documentId}`: read/write only when `userId == request.auth.uid` (aligned)
- `checklistItems/{itemId}`: read/write only when `userId == request.auth.uid` (aligned)
- `mediaLogs/{logId}`: read/write only when `userId == request.auth.uid` (aligned)
- `checklistTemplates/{templateId}`: authenticated read-only, no client writes (aligned with service behavior)

### Storage (`storage.rules`)

- **Fixed mismatch:** previous `allow write` clauses required `request.resource.*`, which blocks delete operations (`request.resource` is null on delete).
- Updated to:
  - `allow create, update` with existing file size/content-type constraints
  - `allow delete` owner-only
- This preserves strict cross-user denial while allowing intended owner deletes.

## Security outcome

- Cross-user access remains denied for all audited Firestore collections and Storage paths.
- Intended service operations now align with rules, including owner deletes in Storage.
