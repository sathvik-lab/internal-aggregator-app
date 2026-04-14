# RFC: Secure Report Links

## Purpose

Define a secure, temporary report-sharing mechanism for readiness exports that:
- avoids exposing raw Firestore documents,
- limits access by time and usage,
- supports revocation and auditability,
- fits Expo + Firebase architecture.

This RFC is for team review before implementation.

## Proposed Approach

Use a **signed one-time token** delivered to a **Cloud Function endpoint** that returns a sanitized report payload (or generated PDF bytes).  
Do **not** serve reports through public Storage rules or direct Firestore document links.

High-level flow:
1. Authenticated owner/user requests a secure link from app.
2. Backend creates token record + metadata (expiry, scope, usage limit).
3. Backend returns URL: `https://<region>-<project>.cloudfunctions.net/reportAccess?t=<token>`.
4. Recipient opens link.
5. Function validates token, TTL, revocation, and usage count.
6. Function returns report once (or limited count), marks token consumed, writes audit log.

## Token Format

Use opaque random token (no embedded business data).

- **Token value:** 256-bit cryptographically secure random bytes, Base64URL encoded.
- **Transport:** query param `t` or path segment.
- **Storage:** store **hash(token)** only (SHA-256), never plaintext token at rest.
- **Lookup key:** `tokenHash`.

Recommended token document shape (`reportAccessTokens/{tokenId}`):
- `tokenHash: string` (required)
- `ownerUserId: string` (required)
- `businessId: string | null`
- `reportType: 'readiness_summary'`
- `createdAt: Timestamp`
- `expiresAt: Timestamp`
- `maxUses: number` (default `1`)
- `usedCount: number` (default `0`)
- `revokedAt: Timestamp | null`
- `revokedReason: string | null`
- `constraints: { ipLock?: string, userAgentHint?: string }` (optional, future)
- `snapshotRef: string | null` (server-only pointer, not exposed)

## TTL Policy

Default TTL should be short:
- **Default:** `48h`
- **Allowed range:** `24h` to `72h`
- Reject requests outside allowed range.
- Expired tokens return `410 Gone` (or normalized error page/message).

## Data Included in Shared Report

Include only minimum business compliance summary needed for inspection context:
- readiness score and label,
- checklist completion %, overdue counts,
- expiring/expired document counts,
- short top-N issue summaries,
- generated timestamp and business display name/state.

Do **not** include:
- user email/phone,
- internal user IDs,
- Firestore collection paths/document IDs,
- raw media/storage URLs,
- debug metadata, stack traces, rule internals.

## Revocation & One-Time Read

Revocation requirements:
- Owner/admin can revoke active token before expiry.
- Revoked token access must fail immediately.

One-time read requirements:
- `maxUses = 1` by default.
- On successful read, atomically increment `usedCount`.
- Deny when `usedCount >= maxUses`.
- Use transaction/atomic write to prevent race-condition double reads.

## Firestore/Storage Exposure Rules

Security constraints:
- Client apps must not receive raw Firestore paths for report retrieval.
- Public Storage rules must not be used as report sharing mechanism.
- Cloud Function should read protected Firestore data using admin privileges and return sanitized output only.

Recommended function endpoints:
- `createSecureReportLink` (authenticated callable/HTTPS)
- `accessSecureReport` (public HTTPS with token)
- `revokeSecureReportLink` (authenticated callable/HTTPS)

## Audit & Monitoring

Log each token event:
- creation,
- access success/failure reason (expired/revoked/used),
- revocation,
- optional requester IP hash and user-agent fingerprint (privacy-safe).

Store in `reportAccessAudit` with retention policy (e.g., 30-90 days).

## Failure Modes & UX

User-facing error states for recipient link:
- link expired,
- link already used,
- link revoked,
- invalid link.

Avoid leaking which specific validation check failed beyond broad category.

## Open Questions for Team Review

1. Should `maxUses` ever exceed 1 for regulator workflows?
2. Do we require optional passcode on top of token for higher-risk exports?
3. Should PDF bytes be generated on-demand or pre-rendered snapshot at link creation?
4. What retention period should apply to token + audit documents?

---

Implementation is intentionally deferred pending review/approval of this RFC.
