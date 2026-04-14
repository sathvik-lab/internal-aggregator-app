# Business Model Migration RFC

**Status:** Proposed  
**Date:** 2026-04-14  
**Owner:** Engineering team  
**Priority:** P2 (post-MVP)  

---

## Problem Statement

Current architecture is **userId-only**: all collections (checklistItems, documents, mediaLogs) are scoped to user UID. This blocks:

- **Multi-staff workflows** (multiple users completing same checklist for one truck)
- **Multi-truck operations** (owner managing 2+ trucks; splitting data)
- **Role enforcement** (owner vs staff permissions at business level)
- **Data isolation** (staff A should not see staff B's items unless assigned)
- **Audit trail** (tracking who did what at business/truck level, not just user)

**Scope of RFC:** Design a phased migration path that:
1. Adds `businesses` and `businessMembers` collections without breaking existing userId-only data
2. Enables incremental adoption; allows owner-only users to stay on userId path temporarily
3. Defines Firestore rules strategy to enforce isolation
4. Minimizes code churn and deployment risk

**Out of scope:** UX for invite links, role management UI, staff dashboards. Those are future sprints.

---

## Proposed Solution

### Phase 0: Preparation (No code changes; planning only)

**Deliverable:** Updated data model diagrams, rule sketches, checklist of affected services.

1. Audit current usage:
   - How many users have multi-device (multiple tokens)?
   - Are there any shared checklist items (unlikely)?
   - How long are typical sessions?

2. Design business + businessMembers schema (see §3).

3. Identify all service functions that touch `users/`, `documents/`, `checklistItems/`, etc.
   - List in `services/*.js`
   - Mark which ones need businessId awareness

4. **Rule strategy:** Plan new rules that allow both models simultaneously (see §4).

**Duration:** 1 sprint (planning)  
**Risk:** Low (no production changes)

---

### Phase 1: Foundation (Add optional businessId; no behavior change)

**Goal:** Enable new writes to include businessId; old writes still work.

**Implementation:**

1. **User document:** Add optional field
   ```javascript
   users/{userId} {
     uid, email, role, ...
     defaultBusinessId: null,  // Will be set on first business creation
   }
   ```

2. **New collections:**
   ```
   businesses/{businessId}
     name, owner (userId), createdAt, ...
   
   businessMembers/{businessId}/members/{userId}
     role, status, joinedAt, ...
   ```

3. **Service changes (minimal):**
   - `userProfile.js`: Add `setDefaultBusiness(userId, businessId)`
   - `createBusiness(userId, businessName)` stub function
   - Document: services assume `userId` for now; `businessId` is optional in Firestore writes

4. **Firestore rules:** Allow both userId-scoped and businessId-scoped reads/writes for same user (overlapping rules).

5. **No UI changes** in this phase; no staff features.

**Duration:** 1 sprint  
**Risk:** Moderate (rules complexity; thorough testing needed)  
**Rollback:** Simple (remove new fields, revert rules)

---

### Phase 2: Business creation flow (Optional; late MVP or Phase 1+)

**Goal:** Owner can create a business; auto-migrate checklist/document scope.

**Implementation:**

1. **New service:** `businessService.js`
   ```javascript
   createBusiness(userId, businessProfile)
     1. Create doc in businesses/{businessId}
     2. Create owner entry in businessMembers/{businessId}/members/{userId}
     3. Update user.defaultBusinessId
     4. Optionally: migrate existing docs/checklists to businessId (see below)
   ```

2. **Firestore schema:** Migrate helper function (Cloud Function or batch script)
   ```javascript
   // Pseudo-code
   migrateUserDataToBusiness(userId, businessId) {
     1. Query all checklistItems where userId == userId
     2. For each, set businessId = businessId (bulk write)
     3. Query all documents where userId == userId
     4. For each, set businessId = businessId (bulk write)
     5. Similarly for mediaLogs
   }
   ```

3. **Rules update:** Queries now check businessId as primary path.

4. **Backward compat:** If user has no defaultBusinessId, treat as single-owner-only; queries default to userId scope (temporary).

**Duration:** 1-2 sprints  
**Risk:** High (data migration; potential consistency issues)  
**Rollback:** Requires restore from backup if bugs found; test heavily in staging first

---

### Phase 3: Staff/multi-user (Post-MVP; blocked until Phase 1+2 stable)

**Goal:** Owner can invite staff; staff can see only assigned items.

**Implementation:**

1. **New UI:** Staff invite link, role assignment (in ProfileScreen or new AdminScreen).
2. **Service updates:**
   - `inviteStaffMember(businessId, email, role)` → sends invite email with link
   - `acceptInvite(token)` → creates businessMembers entry
   - **Query changes:** All fetches now filter by `businessId + businessMembers.role`

3. **Rules update:** Tighten to businessId-only; drop userId fallback.

4. **Data cleanup:** Migrate any remaining userId-only items to businessId.

**Duration:** 2-3 sprints  
**Risk:** Very high (role enforcement in rules + UI; potential security gaps)  
**Pre-req:** Phase 1 + Phase 2 fully stable

---

## Firestore Rules Strategy

### Current (MVP, userId-only)
```
match /documents/{userId}/{documentId} {
  allow read, write: if request.auth.uid == userId;
}

match /checklistItems/{userId}/{itemId} {
  allow read, write: if request.auth.uid == userId;
}
```

### Phase 1 (Dual-mode: userId OR businessId)

```
match /businesses/{businessId} {
  allow read: if request.auth != null;  // Any logged-in user can read (will filter in app)
  allow write: if isOwner(businessId, request.auth.uid);
}

match /businesses/{businessId}/members/{userId} {
  allow read: if request.auth.uid == userId || isOwner(businessId, request.auth.uid);
  allow write: if isOwner(businessId, request.auth.uid);
}

// OLD RULES REMAIN; new data has businessId field
match /documents/{userId}/{documentId} {
  // Old: user-scoped documents
  allow read, write: if request.auth.uid == userId && !has(resource.data.businessId);
  
  // New: documents with businessId (may also have userId for now)
  allow read, write: if isMemberOfBusiness(resource.data.businessId, request.auth.uid);
}

match /checklistItems/{userId}/{itemId} {
  // Old: user-scoped items
  allow read, write: if request.auth.uid == userId && !has(resource.data.businessId);
  
  // New: items with businessId
  allow read, write: if isMemberOfBusiness(resource.data.businessId, request.auth.uid);
}

// Helper functions
function isOwner(businessId, uid) {
  return get(/databases/$(database)/documents/businesses/$(businessId)).data.owner == uid;
}

function isMemberOfBusiness(businessId, uid) {
  return exists(/databases/$(database)/documents/businesses/$(businessId)/members/$(uid));
}
```

### Phase 3 (businessId-only; drop userId fallback)
```
// Remove all userId-based rules; use businessId exclusively
match /documents/{businessId}/{documentId} {
  allow read, write: if isMemberOfBusiness(businessId, request.auth.uid);
}

// ... etc for all collections
```

---

## Data Schema

### New Collections

```
businesses/{businessId}
  owner: string (userId)
  name: string
  state: string
  businessType: string
  foodTypes: array<string>
  createdAt: Timestamp
  updatedAt: Timestamp
  status: string ("active" | "archived")

businesses/{businessId}/members/{userId}
  role: string ("owner" | "staff" | "viewer")
  status: string ("active" | "invited" | "disabled")
  joinedAt: Timestamp
  invitedAt: Timestamp (optional)
  invitedBy: string (userId, optional)
```

### Updated Collections (add businessId, keep userId for backward compat)

```
documents/{businessId}/{documentId}
  // existing fields
  userId: string (who uploaded; for audit trail)
  businessId: string (REQUIRED on new writes; phase 1 makes optional)
  createdAt, updatedAt

checklistItems/{businessId}/{itemId}
  // existing fields
  userId: string (who created; for audit trail)
  assignedTo: string (optional, staff member UID)
  businessId: string (REQUIRED on new writes)
  createdAt, completedAt

mediaLogs/{businessId}/{logId}
  userId: string (who recorded)
  businessId: string
  createdAt

users/{userId}
  defaultBusinessId: string (optional; set on first business creation)
  pushTokens, preferences, ...
```

---

## Backward Compatibility Strategy

### During Phase 1 (Dual-mode)

1. **New users (post-deployment):** Automatically get a "personal business" on signup.
   - Firestore function: After user creation, create a default business with userId as owner.
   - Set `user.defaultBusinessId = businessId`.
   - All subsequent writes use `businessId`.

2. **Existing users (pre-deployment):** Remain on userId-only path until they opt into business creation.
   - Dashboard/ProfileScreen offers: "Create a Business" button.
   - Clicking triggers migration (Phase 2).
   - Until then, queries work via legacy userId rules.

3. **Services:**
   - All service functions accept optional `businessId` parameter.
   - If `businessId` provided, use businessId-based path.
   - If not provided, use userId-based path (legacy).
   - Example:
     ```javascript
     fetchDocuments(userId, businessId = null) {
       if (businessId) {
         // New: query /documents/{businessId}
       } else {
         // Old: query /documents/{userId}
       }
     }
     ```

4. **Rules:** Both paths allowed simultaneously until Phase 3 cutover.

### Cutover to Phase 3 (Breaking change)

1. **Timeline:** At least 2-3 months after Phase 1 stable, announce end-of-life for userId-only path.
2. **Migration:** Batch job in Cloud Function: for any remaining userId-only items, create a default business and migrate.
3. **Force upgrade:** Mobile app version check; old app versions get deprecation warning or forced logout.
4. **Rules:** Remove all userId-scoped rules; use businessId exclusively.

---

## Implementation Checklist

### Phase 1

- [ ] Design Firestore rules (draft in code comment first)
- [ ] Add `businesses` and `businessMembers` collections schema to `firestore.rules`
- [ ] Add `defaultBusinessId` to user document
- [ ] Create stub service functions: `getBusiness()`, `getBusinessMembers()`
- [ ] Update all collection writes to optionally include `businessId`
- [ ] Firestore rules allow both paths simultaneously
- [ ] Test rules in emulator (no actual Firebase change yet)
- [ ] Document schema changes in `ARCHITECTURE.md`
- [ ] Code review + security audit of rules
- [ ] Deploy to staging; smoke test existing userId paths
- [ ] Deploy to production with rules update
- [ ] Monitor: no rule errors, existing flows unblocked

### Phase 2

- [ ] Implement `createBusiness(userId, businessProfile)` service
- [ ] Build migration function (Cloud Function or batch script)
- [ ] Add "Create Business" button to ProfileScreen (optional)
- [ ] Test migration on staging data
- [ ] Update queries to use businessId when available
- [ ] Manual e2e test: create business → migrate data → verify queries work
- [ ] Deploy with feature flag (off by default)
- [ ] Gather feedback; iterate

### Phase 3

- [ ] Design staff invite UI
- [ ] Implement invite flow service (Cloud Function for email, etc.)
- [ ] Update all queries to enforce businessId + role checks
- [ ] Audit Firestore rules for role-based access
- [ ] Migrate remaining userId-only items to default businesses
- [ ] Remove userId fallback from rules
- [ ] E2e test: owner invites staff → staff logs in → sees only assigned items
- [ ] Deploy with feature flag (off by default) 

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|-----------|
| Phase 1 | Rules complexity; edge cases | Heavy testing in emulator; security review before deploy |
| Phase 2 | Data migration inconsistency | Test on staging first; have rollback backup; incremental migration (not all at once) |
| Phase 3 | Role enforcement failures; security gaps | Pen testing of rules; audit every query; feature flag |

---

## Timeline & Sequencing

- **Phase 1 (Foundation):** 1 sprint; no UI changes
- **Phase 2 (Business creation):** 1-2 sprints; optional, can be delayed
- **Phase 3 (Staff/roles):** 2-3 sprints; post-MVP, blocked on Phase 1+2

**Estimated total:** 4-6 sprints (3-4 months)

**Decision point:** After Phase 1 is stable in production (2-3 weeks), decide whether to proceed with Phase 2 or wait for MVP validation.

---

## Open Questions

1. **Single vs. multiple businesses per owner:** Allow owner to have 2+ food trucks? (RFC assumes yes, but if MVP is single-truck, simplifies Phase 2.)
2. **Invite delivery:** Email invites? Link-based? QR code? (Defer to design; Phase 3.)
3. **Backward compat duration:** How long do we support userId-only path? (Propose 6 months post-launch.)
4. **Analytics:** Track adoption of businesses model? (Recommend Firebase Analytics or simple flag.)
5. **Incidents/Maintenance:** Should those be scoped to business or user? (Assume business, but confirm with product.)

---

## References

- Current architecture: `ARCHITECTURE.md`
- Firestore rules: `firestore.rules`
- Current user collections: `src/services/userProfile.js`, `src/services/firestore.js`
- Checklist instances: `src/services/checklistInstanceSync.js`

---

## Approval & Sign-off

- [ ] Engineering lead
- [ ] Product manager
- [ ] Security/compliance review (before Phase 2 data migration)

---

## Changelog

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-04-14 | 1.0 | Engineering | Initial RFC |

