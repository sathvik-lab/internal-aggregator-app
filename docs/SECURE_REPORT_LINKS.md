# Secure readiness report links (Cloud Functions + client)

`src/services/reportLinks.js` calls two **HTTPS** (not callable) endpoints on the same host:

| Endpoint | Method | Body | Auth |
|----------|--------|------|------|
| `generateSecureReadinessReport` | `POST` | `{ startDate?, endDate?, ttlHours?, format?: 'pdf' \| 'html', userId? }` | `Authorization: Bearer <Firebase ID token>` |
| `revokeSecureReadinessReport` | `POST` | `{ reportId }` | Same |

Success responses match the client’s expectations:

- **Generate (200):** `{ reportId, format, expiresAt, signedUrl, tokenId, path, revokeUrl }`
- **Revoke (200):** `{ revoked: true, reportId }`. If the Firestore row still exists and `revokedAt` was set by an older backend version, `{ revoked: true, alreadyRevoked: true, reportId }` (current code deletes the row instead).

Error JSON uses `{ error: '<code>' }` where `<code>` is one of: `missing-auth-token`, `cross-user-request-denied`, `invalid-report-id`, `report-not-found`, `method-not-allowed`, `internal`, `http-*`.

## What the backend does

1. **Auth:** Verifies Firebase ID token (`admin.auth().verifyIdToken`). Rejects `body.userId` when it does not match the token UID.
2. **Data:** Loads `users/{uid}.defaultBusinessId`, then merges **business-scoped** and **legacy user-scoped** `documents`, `checklistItems`, and `mediaLogs` the same way as `src/services/dashboard.js` (so reports match the in-app snapshot).
3. **Storage:** Writes `reports/{uid}/{reportId}.pdf` or `.html` via Admin SDK, returns a **v4 signed read URL** expiring at `expiresAt`.
4. **Metadata:** Writes `reportLinks/{reportId}` with `uid`, `ownerUid`, `businessId`, `path`, `format`, `createdAt`, `expiresAt`, `revokedAt` (no persisted `signedUrl` — only returned once in the HTTP response).
5. **Revoke:** Deletes the Storage object (signed URL stops working), then **deletes** the Firestore metadata document.

## Firestore rules

`reportLinks` is **denied** for all client SDK reads/writes (`firestore.rules`). Only the Admin SDK in Cloud Functions touches this collection.

## CORS

- `cors: false` on both HTTPS functions; custom headers instead of wide open `cors: true`.
- **Allowed origins** default to local Expo ports + `https://foodtruckcompliance.app`. Override with env **`REPORT_LINKS_ALLOWED_ORIGINS`** (comma-separated list). Trailing `*` prefix match is supported (e.g. `https://preview--*.web.app` → use `https://preview-` + `*` pattern by setting a literal prefix + `*` last char per code: `allowed.endsWith('*')` → prefix is `allowed.slice(0, -1)`).
- **React Native** `fetch` usually sends **no** `Origin`; requests are still authorized by Bearer token. CORS mainly affects **Expo web** and browser-based tests.

Set in Cloud Functions runtime (Secret Manager or `firebase functions:config:set` legacy / `.env` for emulators):

```bash
firebase functions:secrets:set REPORT_LINKS_ALLOWED_ORIGINS
# value example: https://app.example.com,http://localhost:8081
```

For v2 params, prefer **defineSecret** in code or Console “Environment variables” for the Functions service account — see current Firebase docs for your CLI version.

## Deploy

From repo root (with Firebase CLI logged in and project selected):

```bash
cd firebase/functions && npm ci
cd ../..
firebase deploy --only functions:generateSecureReadinessReport,functions:revokeSecureReadinessReport
```

Ensure the default Storage bucket exists and the Functions service account has **Storage Admin** (or object create/read/delete) and **Firestore** access.

## Manual runbook (production or emulator)

### Prereqs

- App has `expo.extra.firebaseProjectId` set (`app.config.js` / `.env`).
- User signed in; copy a fresh **ID token** (short-lived). In a dev client you can temporarily log `await auth.currentUser.getIdToken()` or use the REST API with email/password against the Auth emulator.

### 1) Generate

```bash
export PROJECT_ID=your-project-id
export TOKEN='eyJhbGciOi...'

curl -sS -X POST \
  "https://us-central1-${PROJECT_ID}.cloudfunctions.net/generateSecureReadinessReport" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-01-01","endDate":"2026-04-15","ttlHours":48,"format":"pdf"}' \
  | jq .
```

Expect `signedUrl`. Open it in a browser — PDF should download/view until `expiresAt`.

### 2) Revoke

```bash
export REPORT_ID='uuid-from-generate-response'

curl -sS -X POST \
  "https://us-central1-${PROJECT_ID}.cloudfunctions.net/revokeSecureReadinessReport" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"reportId\":\"${REPORT_ID}\"}" \
  | jq .
```

Expect `{ "revoked": true, "reportId": "..." }`. Re-fetch the same `signedUrl` — should fail (object removed).

### 3) CORS (browser / Expo web)

From an **allowed** origin, a preflight should succeed:

```bash
curl -i -X OPTIONS \
  "https://us-central1-${PROJECT_ID}.cloudfunctions.net/generateSecureReadinessReport" \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expect `204` and `Access-Control-Allow-Origin: http://localhost:8081` when that origin is allowlisted.

## Score parity note

The PDF/HTML body uses a **lighter** `calculateComplianceScore` helper inside `firebase/functions/index.js` than `src/utils/complianceScore.js` (e.g. no incidents/maintenance penalties). Treat the file as an executive snapshot, not a bit-identical duplicate of the app score.

## Integration test (optional)

There is no automated test in-repo by default (Admin SDK + Storage). The curl flow above is the supported smoke test. Add CI later with the Firebase emulator suite and a rules bypass if you need regression coverage.
