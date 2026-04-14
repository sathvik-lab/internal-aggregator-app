# Firestore Rules Security Matrix (Staging)

## Scope

Business-aware access checks for:
- `businesses`
- `businessMembers`
- `documents`
- `checklistItems`
- `mediaLogs`

Legacy `userId`-only documents remain supported.

## Expected Access Matrix

| Actor | businesses | businessMembers | documents (businessId) | checklistItems (businessId) | mediaLogs (businessId) |
|---|---|---|---|---|---|
| Owner member | Read/Write own business | Read/Write members | Read/Write | Read/Write | Read/Write |
| Staff member | Read | Read own member row | Read only | Read/Write | Read only |
| Non-member authenticated user | Deny | Deny | Deny | Deny | Deny |
| Unauthenticated | Deny | Deny | Deny | Deny | Deny |

Legacy path (no `businessId`): only `resource.data.userId == request.auth.uid` can read/write.

## Manual Staging Test Plan

Use three accounts:
- `ownerA`
- `staffA` (member of ownerA business with role `staff`)
- `userB` (not a member)

### 1) Businesses / Members
- Owner creates business: **allow**
- Staff reads business: **allow**
- userB reads ownerA business: **deny**
- Staff updates membership: **deny**
- Owner updates membership: **allow**

### 2) Business-scoped Documents
- Owner create/read/update/delete with `businessId`: **allow**
- Staff read same business documents: **allow**
- Staff create/update/delete same business documents: **deny**
- userB read any business document: **deny**

### 3) Business-scoped Checklist Items
- Owner create/read/update/delete with `businessId`: **allow**
- Staff create/read/update/delete with same `businessId`: **allow**
- userB create/read/update/delete with ownerA `businessId`: **deny**

### 4) Business-scoped Media Logs
- Owner create/read/update/delete with `businessId`: **allow**
- Staff read same business media logs: **allow**
- Staff create/update/delete same business media logs: **deny**
- userB read any business media log: **deny**

### 5) Legacy userId-only documents
- ownerA accesses own legacy docs/items/logs (`businessId` missing): **allow**
- staffA accesses ownerA legacy docs/items/logs: **deny**
- userB accesses ownerA legacy docs/items/logs: **deny**

## Deployment Note

Deploy these rules to staging first, run full matrix, then promote to production only after all deny/allow expectations match.
