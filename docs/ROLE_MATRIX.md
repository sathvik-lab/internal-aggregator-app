# Role matrix (owner vs staff)

**Canonical access control** is **`firestore.rules`** (and `storage.rules`). This matrix documents **intended** behavior and how the **Expo app** enforces it with `useEffectiveRole()` (`src/hooks/useEffectiveRole.js`), navigation, and disabled UI.

**RULES-02:** When adding collections or client write paths in `src/services/`, update rules and this table together, then verify on a staging project.

## Role resolution

| Source | Notes |
|--------|--------|
| `users/{uid}.role` | Default from signup; owners stay `owner`. |
| `businessMembers/{businessId}/members/{uid}.role` | For `staff`, effective business role comes from here via `getCurrentMemberRole` in `businessMembers.js`. |

`useEffectiveRole` returns `{ role, isOwner, isStaff, loading }`. **Gate destructive or policy-sensitive actions** until `loading === false` so staff never flashes as owner.

## Firestore operations vs role

| Domain | Collection / area | Read (business-scoped) | Create | Update / delete |
|--------|-------------------|------------------------|--------|-------------------|
| Checklist | `checklistItems` | Member (`isMemberOf`) | Owner **or** staff (`canWriteBusinessChecklist`) | Owner **or** staff |
| Documents | `documents` | Member | **Owner only** (business-scoped) | **Owner only** |
| Incidents | `incidents` | Member | Owner **or** staff (`canWriteBusinessOperations`) | Owner **or** staff |
| Maintenance | `maintenanceTasks` | Member | Owner **or** staff | Owner **or** staff |
| Media logs | `mediaLogs` | Member | **Owner only** (when `businessId` set) | **Owner only** (business-scoped) |
| Visibility | `users/{uid}`, `businesses/{id}` | Own user; business per rules | N/A | User doc: self; **business** doc: **owner only** |
| Invites | `businessMembers/.../inviteCodes` | Owner | Owner | Owner |

Legacy rows (`businessId == null`, `userId == request.auth.uid`) follow **self-only** paths in rules; the app still treats **compliance library uploads** on a joined business as **owner-only** to match business-scoped document rules.

## Screens / components (client enforcement)

| Surface | Owner | Staff | Implementation notes |
|---------|-------|-------|------------------------|
| **Documents** list + FAB + empty CTA | Upload / open modal | View list; no FAB; no empty-state upload CTA | `DocumentsScreen.js`, `uploadAllowed` on `UploadDocumentModal` |
| **Document detail** | Edit, delete | View, download, share only if no mutation | `DocumentDetailScreen.js` — `canMutateDocument` |
| **Dashboard** quick action “Upload” | Navigates to Documents + modal | Alert; no navigation | `DashboardScreen.js`, `QuickActions` `uploadDisabled` |
| **Checklist** complete / snooze | Yes | Yes | `roleLoading` early-return in handlers (`ChecklistScreen.js`) |
| **Checklist** add FAB / template sync | Left enabled for both unless product narrows | Same | Optional future: owner-only sync |
| **Incidents** create / detail status | Yes | Yes | Create button disabled while `useEffectiveRole().loading` |
| **Maintenance** create / detail status | Yes | Yes | Same |
| **Media logs** FAB + empty CTA | Add log | Read only | `MediaLogScreen.js` — `isOwner` |
| **Profile** business profile block | Shown | Hidden | Existing `isOwner` |
| **Profile** visibility toggles | Business + user flags when owner + `defaultBusinessId` | User-level flags only | Existing `isOwner` / `businessId` |
| **Profile** team / invite | Shown | Hidden | `StaffScreen` only in stack for owner (`MainNavigator.js`) |

## Storage

Paths remain **uid-scoped** in `storage.rules`. Firestore still gates **business document metadata** creation to owners; failed Firestore writes should not happen if UI matches this matrix.

## Related files

- `src/hooks/useEffectiveRole.js`
- `firestore.rules`, `storage.rules`
- `src/services/businessMembers.js` (`getCurrentMemberRole`, invites)
