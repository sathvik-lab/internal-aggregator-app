# Phase 1 Migration Notes (Business Model RFC)

## Scope Implemented
- New owner flows now create:
  - `businesses/{businessId}`
  - `businessMembers/{businessId}/members/{ownerUid}`
  - `users/{uid}.defaultBusinessId`
- New writes include optional `businessId` for:
  - `checklistItems`
  - `documents`
  - `mediaLogs`
- Existing `userId` fields are preserved on all writes.

## Backward Compatibility
- Existing users without `defaultBusinessId` continue on legacy `userId` queries and data.
- Services now support dual-mode reads:
  - prefer `businessId` when available,
  - merge/fallback to legacy `userId` records.

## Migration Strategy (No destructive migration in Phase 1)
1. Deploy code and rules with dual-mode support.
2. New owner signups/onboarding automatically receive `defaultBusinessId`.
3. Existing users continue uninterrupted on `userId`-scoped documents.
4. Future Phase 2 can backfill legacy records with `businessId` in batches.
5. Future Phase 3 can remove legacy fallback after migration completion.
