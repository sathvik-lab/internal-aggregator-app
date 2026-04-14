# PRD §6 Traceability (Code ↔ Product)

**Source PRD:** Root [`PRD.md`](../PRD.md) §6 Functional Requirements.  
**Branch context:** [`PRD.md`](../PRD.md) “Branch Clarification” — stack is Expo + Firebase; authoritative MVP boundaries are also in [`BRANCH_PRODUCT_REFINEMENT_GUIDE.md`](../BRANCH_PRODUCT_REFINEMENT_GUIDE.md) §8–9.

**Legend**

| Status | Meaning |
|--------|---------|
| **Done** | Implemented end-to-end for the stated PRD bullet (may differ in UX detail). |
| **Partial** | Some bullets covered; others missing or stubbed. |
| **Missing** | No meaningful implementation in `src/`. |
| **N/A** | Not applicable to current stack (e.g. Supabase) or explicitly post-MVP in branch docs. |

---

## §6.1 Authentication & Roles

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Sign up / log in (email) | `src/services/auth.js`, `src/screens/auth/LoginScreen.js`, `src/screens/auth/SignupScreen.js`, `src/context/AuthContext.js` | **Done** | Firebase email/password. |
| Sign up / log in (phone) | — | **Missing** | No phone auth in `src/`. |
| Password reset | `src/services/auth.js`, `src/screens/auth/ForgotPasswordScreen.js` | **Done** | |
| Roles: Owner / Staff | `src/constants/constants.js` (`USER_ROLES`), `SignupScreen.js` (default `OWNER`), Firestore `users` profile | **Partial** | Role is stored; **no** Firestore rules/UI split by role beyond onboarding gate and Staff placeholder. |
| Owner: all logs/reports, manage staff, visibility, export | `DashboardScreen.js`, `InspectionReadinessScreen.js`, `ProfileScreen.js`, `StaffScreen.js` (placeholder) | **Partial** | Staff management is placeholder; no public visibility controls. |
| Staff: checklists, incidents, assigned tasks | Checklist/media accessible to all signed-in users | **Partial** | No incident module; no assigned-task model (`docs/BUSINESS_MODEL_RFC.md`). |

---

## §6.2 Truck Setup & Configuration

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Truck/business name, type, category, permits, location | `src/screens/onboarding/OwnerOnboardingScreen.js`, `src/services/userProfile.js`, profile UI on `ProfileScreen.js` | **Partial** | Onboarding enforces minimum business profile; field set may not match every PRD label. |
| Auto-assign checklists from truck/category | `src/services/checklistTemplateSync.js`, `checklistFiltering.js`, `checklistInstanceSync.js`, `checklistScheduling.js` | **Done** | Template-driven instances in `checklistItems`. |

---

## §6.3 Digital Compliance Checklists

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Daily / weekly / monthly types | Templates + `dueDate` / scheduling in `checklistScheduling.js`, `ChecklistScreen.js` | **Done** | Driven by template metadata and instances. |
| Pre-filled items from category | Template sync + filtering (services above) | **Done** | |
| Checkbox/toggle, notes, photos, timestamp, attribution | `src/screens/ChecklistScreen.js`, `src/components/checklist/*`, `src/services/firestore.js` | **Partial** | Attribution/timestamp patterns depend on writes in checklist flows; verify per save path in components. |
| Incomplete critical items → score; missed → dashboard warnings | `src/utils/complianceScore.js`, `src/services/dashboard.js`, `DashboardScreen.js` | **Partial** | Score uses overdue/completion; **no** separate “critical item” flag in score beyond item data if present in Firestore. |

---

## §6.4 Incident & Maintenance Logging

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Incident types, fields, media | `src/services/incidents.js`, `src/screens/IncidentsScreen.js`, `src/screens/IncidentDetailScreen.js`, `src/services/dashboard.js` | **Partial** | List/create/detail + optional media attachment implemented. Assignment/workflow automation still limited. |
| Maintenance tasks, assign, track | `src/services/maintenanceTasks.js`, `src/screens/MaintenanceTasksScreen.js`, `src/screens/MaintenanceTaskDetailScreen.js`, `src/services/dashboard.js` | **Partial** | List/create/detail + status updates implemented; assignment lifecycle still basic. |

---

## §6.5 Compliance Scoring System

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Inputs: completion, incidents, certs overdue, maintenance | `src/utils/complianceScore.js`, `src/services/dashboard.js`, `src/components/common/ScoreBreakdownModal.js` | **Partial** | Uses checklist completion, overdue items (including critical), expiring/expired docs, open severe incidents, overdue maintenance, and recent media logs. Certification-specific weighting remains out of scope. |
| 0–100 + green/yellow/red style status | `complianceScore.js` (`getScoreDescription`), `DashboardScreen.js`, `src/components/common/ScoreBreakdownModal.js`, `InspectionReadinessScreen.js` | **Done** | Labels: Excellent / Good / Fair / Low (bands in `getScoreDescription`). |
| Dashboard insights / tips | `src/services/dashboard.js` (`buildReadinessSummary`), `DashboardScreen.js` | **Done** | Narrative readiness copy is separate from the numeric `calculateComplianceScore` formula. |

---

## §6.6 Inspection Readiness & Reporting

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Inspection mode, date filters, aggregated views | `src/screens/InspectionReadinessScreen.js`, `src/services/dashboard.js` (`fetchDashboardSnapshot`) | **Partial** | Readiness screen aggregates snapshot data; not a separate global “mode” toggle across the app. |
| Export PDF | — | **Missing** | |
| Shareable report | `src/utils/readinessExport.js` (`shareReadinessSummary`, plaintext/HTML generators) | **Partial** | Native **Share** sheet / plaintext summary; not a hosted secure link. |
| Secure report link | — | **Missing** | |

---

## §6.7 Training & Certification Tracking

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Permits/certs as documents, expiry, upload | `src/screens/DocumentsScreen.js`, `DocumentDetailScreen.js`, `src/services/storage.js`, `firestore.js` (documents), `src/utils/documentTypes.js` | **Partial** | Document model supports expiry and types; no separate “certification” module or auto-reminder push. |
| Reminders | — | **Missing** | No scheduled notifications (see `NOTIFICATIONS_SPIKE.md`). |
| Status tags Active / Expiring / Expired | Document list/detail UI + dashboard expiring/expired lists | **Partial** | Surfaced via dashboard/documents flows; wording may differ from PRD tags. |

---

## §6.8 Privacy & Public Visibility Controls

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Public truck / score visibility, consent, default private | — | **Missing** | No `publicVisibility` (or similar) in `src/`. |

---

## Cross-cutting (PRD §7–8)

| Topic | Primary implementation files | Status | Notes |
|-------|------------------------------|--------|--------|
| Firestore security rules | `firestore.rules`, `storage.rules` | **Done** | Verify against live paths in `src/services/`. |
| Offline-first / sync SLA | `src/services/firebase.js` | **Partial** | Online-first MVP; persistence as enabled by SDK, not full offline-first product behavior. |
| Analytics (§9) | — | **Missing** | Not wired in `src/` from this traceability pass. |

---

## Navigation & entry (supports multiple §6 areas)

| Area | Files |
|------|--------|
| Auth vs onboarding vs main | `src/navigation/AppNavigator.js`, `AuthNavigator.js`, `OnboardingNavigator.js`, `MainNavigator.js`, `navigationConfig.js` |
| Deep linking config | `navigationConfig.js` (`DEEP_LINKING_CONFIG`) — product handling still partial |

---

*Last updated to match repository layout as of documentation refresh (see also [`NAVIGATION_DOCUMENTATION.md`](../NAVIGATION_DOCUMENTATION.md) and [`CHECKLIST_DATA_AND_SCORING.md`](../CHECKLIST_DATA_AND_SCORING.md)).*
