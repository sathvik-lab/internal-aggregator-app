# Implementation phases — detailed agent prompts

This document turns the seven-phase rollout plan into **copy-paste prompts** for an AI coding agent or for human tickets. Each prompt is self-contained: include the **Repository context** line in every run unless the agent already has the repo.

**How to use**

1. Complete phases in order unless a prompt explicitly says it can run in parallel.
2. After each phase, run `npm run lint`, manual smoke on device/simulator, and update [`docs/PRD_TRACEABILITY.md`](PRD_TRACEABILITY.md) if behavior changed.
3. All Firebase access stays in `src/services/` per `Agents.md`.

**Repository context (prepend to any prompt if needed)**

```text
Repository: internal-aggregator-app — Expo React Native + Firebase (Auth, Firestore, Storage). Product code under src/. Firebase only via src/services/. Functional components + hooks; StyleSheet at file bottom. Follow AGENTS.md / Agents.md conventions. do not explain what you are doing
```

---

## Phase 0 — Tighten current product (low risk)

### P0-A — Checklist write path consistency

```text
Repository: internal-aggregator-app (Expo + Firebase).

Goal: Single canonical path for updating checklist item completion state so `completed`, `status`, `completedAt`, and `updatedAt` (and `completedBy` or `lastUpdatedBy` if you add it) stay consistent.

Tasks:
1. Audit ChecklistScreen.js and src/components/checklist/* for all Firestore writes to checklistItems.
2. Add or extend a function in src/services/ (e.g. firestore.js or a small checklistItemService.js) such as updateChecklistItemCompletion({ itemId, completed, userId }) that sets status to completed|pending|overdue consistently with completed boolean and sets completedAt to ISO string or null and updatedAt to now.
3. Replace direct updates from components with calls to this service.
4. Document the truth table (completed + status) in a short comment above the helper.

Acceptance: No duplicate conflicting writes; uncompleted items have completedAt null; completed items have status completed and completedAt set; all writes go through services.
```

### P0-B — Critical checklist items in score and readiness

```text
Repository: internal-aggregator-app.

Goal: If an item is "critical" (use existing priority === 'critical' or add isCritical boolean from templates — pick one approach and document it), increase overdue/incomplete impact in compliance score and surface first in InspectionReadinessScreen issues.

Tasks:
1. Inspect Firestore checklist item shape from templates/sync; choose minimal field (priority or isCritical).
2. Extend src/utils/complianceScore.js: add optional heavier penalty for overdue critical items (e.g. extra points per critical overdue, with a cap). Keep score 0–100.
3. Update DashboardScreen and InspectionReadinessScreen to pass the data needed (overdue list may already suffice if items carry priority).
4. Sort or tag critical issues at top of readiness issue list.

Acceptance: Non-critical behavior unchanged if no critical flags exist; with critical overdue items, score drops more than non-critical-only case; readiness UI shows critical blockers prominently.
```

### P0-C — Document expiry badges (PRD-aligned labels)

```text
Repository: internal-aggregator-app.

Goal: On DocumentsScreen and DocumentDetailScreen, show clear badges: Active, Expiring soon (e.g. ≤30 days), Expired — derived from existing expiry fields only.

Tasks:
1. Add a small util src/utils/documentExpiryStatus.js (or extend documentTypes.js) with getDocumentExpiryStatus(expiryDate) returning { label, tone }.
2. Use it in list rows and detail header; match app theme colors.
3. Ensure accessibilityLabel includes the status.

Acceptance: Documents without expiry show neutral state; expired and expiring-soon are visually distinct; no new Firestore fields required unless already planned.
```

### P0-D — Profile navigation constant

```text
Repository: internal-aggregator-app.

Goal: Replace hardcoded 'Staff' in ProfileScreen.js with ROUTES.PROFILE.STAFF from navigationConfig.js.

Acceptance: Staff navigation still works; no regression on Profile stack.
```

### P0-E — Firestore and Storage rules audit

```text
Repository: internal-aggregator-app.

Goal: List every collection and storage path read/written in src/services/*.js and verify firestore.rules and storage.rules allow intended access and deny cross-user access. Fix mismatches without weakening security.

Tasks:
1. Grep src/services for collection names and storage paths.
2. Compare to rules files; document gaps in a short comment at top of a new docs/RULES_AUDIT.md or inline in PR description (prefer one file under docs/ if team wants history).
3. Patch rules and/or services so paths align.

Acceptance: Rules compile; manual test: signed-in user cannot read another uid’s documents in console or app.
```

---

## Phase 1 — Readiness, filters, inspection UX, PDF export

### P1-A — Readiness snapshot date range

```text
Repository: internal-aggregator-app.

Goal: InspectionReadinessScreen supports an optional date range (defaults: all recent / last 90 days or product-chosen default) for checklist activity and media logs shown in the readiness summary. Dashboard can stay unchanged or gain the same filter later.

Tasks:
1. Extend fetchDashboardSnapshot in src/services/dashboard.js to accept optional { startDate, endDate } and filter checklist items / media logs client-side or via query if indexes exist.
2. Add UI on InspectionReadinessScreen: presets (Last 7 / 30 / 90 days) + custom range if feasible on RN.
3. Refresh snapshot when range changes.

Acceptance: Changing range changes counts and issue list consistently; loading and empty states preserved; no Firebase calls from UI components (only services).
```

### P1-B — Inspection mode (lightweight UI state)

```text
Repository: internal-aggregator-app.

Goal: "Inspection mode" toggle on InspectionReadinessScreen (or header) that simplifies layout: hide secondary chrome, larger typography for key metrics, focus checklist/doc/evidence shortcuts. Persist only in component state or AsyncStorage for session — no backend.

Tasks:
1. Add toggle and conditional styles using existing theme.
2. Ensure toggle has accessibilityLabel.

Acceptance: Toggle is obvious; layout remains usable on small phones; no navigation regressions.
```

### P1-C — PDF export for readiness summary

```text
Repository: internal-aggregator-app.

Goal: User can export readiness as PDF from InspectionReadinessScreen, reusing data already used for shareReadinessSummary.

Preferred approach (choose minimal deps):
- Option A: Use expo-print (or react-native-html-to-pdf if already aligned with Expo SDK) to render HTML from existing generateReadinessHtml in src/utils/readinessExport.js and produce a PDF file, then share via Share API.
- Option B: If deps are undesirable, document "Phase 2 Cloud Function" only — but default is try client-side first with expo-print if compatible with Expo 54.

Tasks:
1. Add dependency if needed with expo install; wire generateReadinessHtml → PDF → cache file → Share.
2. Add confirmation Alert about PII before export (align with comments in readinessExport.js).
3. Handle errors gracefully.

Acceptance: On device, user gets a PDF in share sheet; plaintext share still works; no secrets in PDF.
```

### P1-D — Share exported PDF

```text
Repository: internal-aggregator-app.

Goal: After P1-C, ensure Share shares the PDF file URI where platform supports file sharing; fallback to message text if not.

Acceptance: iOS and Android tested or documented limitations in code comment.
```

---

## Phase 2 — Secure report links (backend)

### P2-A — Design and security note

```text
Repository: internal-aggregator-app.

Goal: Write docs/SECURE_REPORT_LINKS.md specifying: token format, TTL (e.g. 24–72h), what data is included, revocation, and that links must not expose raw Firestore. Prefer one-time read via Cloud Function over public Storage rules.

Deliverable: Markdown RFC ≤2 pages; team review before implementation.
```

### P2-B — Cloud Function: generate report artifact

```text
Repository: internal-aggregator-app + firebase/functions (create functions package if missing).

Goal: Callable or HTTPS authenticated Function: input Firebase ID token + optional date range; output short-lived signed URL or token id for HTML/PDF report generated server-side from Firestore (server SDK uses admin to read only caller’s uid data).

Tasks:
1. Scaffold functions with firebase-admin; verify caller uid from token.
2. Build report payload same shape as client readiness export; render PDF or HTML on server.
3. Write to Storage under reports/{uid}/{reportId}.pdf with metadata { expiresAt }.
4. Return signed URL with expiry matching TTL.

Acceptance: Expired reports are not downloadable; user A cannot request report for user B.
```

### P2-C — Client: Generate link button

```text
Repository: internal-aggregator-app.

Goal: On InspectionReadinessScreen, owner taps "Generate shareable link"; app calls Function with current user token; shows link + expiry + copy button; optional "Revoke" if you store reportId in Firestore for revocation list.

Tasks:
1. Add src/services/reportLinks.js wrapping HTTPS/callable call.
2. UI with PII warning modal before call.

Acceptance: Link works until expiry; revoke works if implemented; errors mapped to friendly messages.
```

---

## Phase 3 — businessId and roles

### P3-A — Schema migration plan execution (incremental)

```text
Repository: internal-aggregator-app.

Read docs/BUSINESS_MODEL_RFC.md and implement Phase 1 of RFC only: add optional businessId to new writes for checklistItems, documents, mediaLogs where appropriate; create businesses and businessMembers collections; on owner signup/onboarding completion create a business doc and member row (owner).

Tasks:
1. Extend userProfile or onboarding service to create business + membership.
2. Dual-read: services accept data with or without businessId; prefer businessId when present on user profile (defaultBusinessId).
3. Do not break existing userId-only documents.

Acceptance: New users get businessId; old users still load data; document migration strategy in PR description.
```

### P3-B — Firestore rules for business scope

```text
Repository: internal-aggregator-app.

Goal: Update firestore.rules so business-scoped documents are readable/writable only by members of that business with appropriate role (owner full, staff read/write limited as product decides — start owner-only staff write to assigned items only if too large, else staff can write checklist items for business).

Tasks:
1. Add helper functions isMemberOf(businessId), memberRole(businessId).
2. Tighten rules incrementally; deploy to staging first.

Acceptance: Security tests or manual matrix documented; no open world read.
```

### P3-C — Staff screen MVP (invite stub)

```text
Repository: internal-aggregator-app.

Goal: Replace pure placeholder on StaffScreen with real but minimal flow: show business name, list members from businessMembers (owner only), "Invite teammate" opens modal with explanation that full email invite is coming OR deep link placeholder; OR generate invite code stored in Firestore for manual share.

Tasks:
1. services/businessMembers.js CRUD as needed.
2. Gate screen: non-owners see message to contact owner.

Acceptance: Owner sees members list; rules enforce visibility.
```

### P3-D — Role-based navigation shell

```text
Repository: internal-aggregator-app.

Goal: If role === staff, optionally hide Profile sub-features (business settings) or default tab to Checklist per product decision. Implement minimal version: one source of truth hook useEffectiveRole() reading user profile + businessMembers.

Acceptance: Owner experience unchanged; staff cannot access owner-only routes.
```

---

## Phase 4 — Incidents and maintenance

### P4-A — Firestore schema and rules

```text
Repository: internal-aggregator-app.

Goal: Add incidents and maintenanceTasks collections (with userId and optional businessId). Fields align with INCIDENT_TYPES and INCIDENT_SEVERITY in constants.js; maintenance: title, status, dueDate, assigneeUserId optional, incidentId optional.

Tasks:
1. Document schema in docs/INCIDENT_MAINTENANCE_SCHEMA.md.
2. firestore.rules + indexes if new compound queries.

Acceptance: CRUD allowed only for owning user or business members per Phase 3 rules.
```

### P4-B — Services layer

```text
Repository: internal-aggregator-app.

Goal: src/services/incidents.js and src/services/maintenanceTasks.js — list, create, update, delete, optional attach media via existing storage patterns.

Acceptance: No Firebase imports in screens; errors handled consistently with other services.
```

### P4-C — Screens and navigation

```text
Repository: internal-aggregator-app.

Goal: Incidents list + create + detail; Maintenance list + create + detail; entry points from Dashboard and InspectionReadinessScreen (counts and deep links). Use FlatList; loading/empty/error states.

Acceptance: End-to-end create on device; images optional follow document upload patterns.
```

### P4-D — Score and readiness integration

```text
Repository: internal-aggregator-app.

Goal: Extend calculateComplianceScore with bounded penalties for open high-severity incidents and overdue maintenance tasks; add factors to breakdown modal; add readiness issues.

Tasks:
1. Pass incidents/maintenance arrays from dashboard snapshot (extend fetchDashboardSnapshot).
2. Tune caps so one bad day cannot zero the score unless product wants that.

Acceptance: CHECKLIST_DATA_AND_SCORING.md and PRD_TRACEABILITY updated.
```

---

## Phase 5 — Certifications and reminders

### P5-A — In-app reminder banners

```text
Repository: internal-aggregator-app.

Goal: Dashboard (and optionally Documents tab) shows a dismissible banner for expiring/expired documents using existing snapshot data; optional snooze stored in userPreferences service / Firestore user doc.

Acceptance: Dismiss persists across sessions; accessible labels.
```

### P5-B — Required document matrix v1

```text
Repository: internal-aggregator-app.

Goal: Config object (e.g. src/config/requiredDocumentsByState.js) mapping US state → list of required document types (use documentTypes.js enums). Dashboard shows "Missing required: X" when no document of that type uploaded.

Tasks:
1. Keep v1 small (2–3 states or "default" fallback).
2. Readiness screen lists missing required types.

Acceptance: No false criticals when profile state unset — degrade to generic guidance.
```

### P5-C — Push notifications spike → production (optional)

```text
Repository: internal-aggregator-app.

Goal: Follow NOTIFICATIONS_SPIKE.md; implement Expo push + FCM token storage; Cloud Function scheduled to notify expiring docs / overdue checklist (minimal). Feature flag in user preferences.

Acceptance: Opt-in; no notification without consent; token secured by rules.
```

---

## Phase 6 — Privacy and public visibility

### P6-A — Settings model and UI

```text
Repository: internal-aggregator-app.

Goal: Firestore fields (user or business per Phase 3): publicProfileEnabled (default false), publicScoreEnabled (default false). Profile or Business settings section with PRD-style consent copy explaining impact.

Tasks:
1. userProfile or business service updates.
2. Rules: no public reads of private collections — flags are for future API only.

Acceptance: Defaults private; toggles persist; clear copy.
```

### P6-B — Future public read API stub (optional)

```text
Repository: internal-aggregator-app + functions.

Goal: HTTPS Function getPublicTruckSummary(slug) returns only non-PII fields if publicProfileEnabled; returns 404 otherwise. No implementation of map UI required.

Acceptance: Cannot enumerate all trucks; rate limit considered.
```

---

## Phase 7 — Auth, analytics, deep links, offline honesty

### P7-A — Firebase Analytics events

```text
Repository: internal-aggregator-app.

Goal: Add @react-native-firebase/analytics OR expo-firebase-analytics if compatible, or Firebase JS analytics if appropriate for Expo — pick one supported approach for Expo 54. Log events: checklist_item_completed, document_uploaded, readiness_share, incident_created (stub until Phase 4), screen_view for main tabs.

Tasks:
1. Wrap in src/services/analytics.js with no-op in __DEV__ if desired.
2. Document event names in docs/ANALYTICS_EVENTS.md.

Acceptance: Events visible in Firebase DebugView or console for test build.
```

### P7-B — Deep linking end-to-end

```text
Repository: internal-aggregator-app.

Goal: Wire app.config.js / app.json scheme to match DEEP_LINKING_CONFIG in navigationConfig.js; verify foodtruckcompliance:// paths for login, dashboard, documents/list, readiness; document any host limitations.

Acceptance: Cold start opens correct screen on one path minimum (e.g. readiness).
```

### P7-C — Phone authentication (optional, high friction)

```text
Repository: internal-aggregator-app.

Goal: Add optional phone sign-in using Firebase Auth phone provider compatible with Expo (may require custom dev client or web reCAPTCHA flow). New screens: PhoneLoginScreen; extend auth.js; do not remove email auth.

Tasks:
1. Spike on one platform first (iOS or Android).
2. Document setup steps in FIREBASE_SETUP.md.

Acceptance: Phone sign-in works in dev build; production checklist for SHA keys / APNs as needed.
```

### P7-D — Offline positioning and resilience

```text
Repository: internal-aggregator-app.

Goal: No full offline-first rebuild unless product mandates. Add user-visible copy when network fails (existing error handler patterns); ensure Firestore persistence settings in firebase.js are documented in README; optional retry toasts on Dashboard snapshot failure.

Acceptance: Users are not promised offline where unsupported; errors are actionable.
```

---

## Phase checklist (for project tracking)

| Phase | Prompt IDs | Depends on |
|-------|----------------|------------|
| 0 | P0-A – P0-E | — |
| 1 | P1-A – P1-D | 0 recommended |
| 2 | P2-A – P2-C | 1 (PDF/data shape) |
| 3 | P3-A – P3-D | 0-E rules discipline |
| 4 | P4-A – P4-D | 3 for multi-user; else userId-only first |
| 5 | P5-A – P5-C | 1 optional |
| 6 | P6-A – P6-B | 3 for business-level flags |
| 7 | P7-A – P7-D | Can parallelize partially |

---

## Maintenance

When a phase ships, update [`docs/PRD_TRACEABILITY.md`](PRD_TRACEABILITY.md) and remove or mark completed prompts here in your internal tracker (this file can stay as historical prompt library).
