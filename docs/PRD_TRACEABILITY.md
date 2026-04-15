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
| Sign up / log in (phone) | `src/services/auth.js` (`requestPhoneSignInCode`, `confirmPhoneSignInCode`), `src/screens/auth/PhoneLoginScreen.js`, `src/screens/auth/LoginScreen.js` (navigate to phone flow), `src/navigation/AuthNavigator.js` | **Partial** | Phone **sign-in** implemented; **no** phone sign-up on `SignupScreen.js`. |
| Password reset | `src/services/auth.js`, `src/screens/auth/ForgotPasswordScreen.js` | **Done** | |
| Roles: Owner / Staff | `src/constants/constants.js` (`USER_ROLES`), `src/screens/auth/SignupScreen.js` (default `OWNER`), Firestore `users` profile | **Partial** | Role is stored; **no** Firestore rules/UI split by role beyond onboarding gate and Staff placeholder. |
| Owner: all logs/reports, manage staff, visibility, export | `src/screens/DashboardScreen.js`, `src/screens/InspectionReadinessScreen.js`, `src/screens/ProfileScreen.js`, `src/utils/readinessExport.js`, `src/services/reportLinks.js`, `src/screens/StaffScreen.js` (placeholder) | **Partial** | Staff management still placeholder; owner has profile visibility toggles, client PDF export, and optional secure report link (Cloud Functions). |
| Staff: checklists, incidents, assigned tasks | `src/screens/ChecklistScreen.js`, `src/screens/IncidentsScreen.js`, `src/screens/MaintenanceTasksScreen.js`, related services (see §6.4); owner vs staff UI + rules: [`docs/ROLE_MATRIX.md`](./ROLE_MATRIX.md) | **Partial** | Incidents + maintenance UIs exist; document upload + business doc edit/delete + business media log compose are **owner-only** in app + `firestore.rules`. |

---

## §6.2 Truck Setup & Configuration

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Truck/business name, type, category, permits, location | `src/screens/onboarding/OwnerOnboardingScreen.js`, `src/services/userProfile.js`, `src/screens/ProfileScreen.js` | **Partial** | Onboarding enforces minimum business profile; field set may not match every PRD label. |
| Auto-assign checklists from truck/category | `src/services/checklistTemplateSync.js`, `src/services/checklistFiltering.js`, `src/services/checklistInstanceSync.js`, `src/services/checklistScheduling.js` | **Done** | Template-driven instances in `checklistItems`. |

---

## §6.3 Digital Compliance Checklists

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Daily / weekly / monthly types | Templates + `dueDate` / scheduling in `src/services/checklistScheduling.js`, `src/screens/ChecklistScreen.js` | **Done** | Driven by template metadata and instances. |
| Pre-filled items from category | Template sync + filtering (services above) | **Done** | |
| Checkbox/toggle, notes, photos, timestamp, attribution | `src/screens/ChecklistScreen.js`, `src/components/checklist/*`, `src/services/firestore.js` | **Partial** | Attribution/timestamp patterns depend on writes in checklist flows; verify per save path in components. |
| Incomplete critical items → score; missed → dashboard warnings | `src/utils/complianceScore.js` (`priority === 'critical'` on overdue items), `src/services/dashboard.js`, `src/screens/DashboardScreen.js` | **Partial** | Score applies extra penalty for critical overdue items; dashboard surfacing of “missed” vs “overdue” wording may differ from PRD. |

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
| Inputs: completion, incidents, certs overdue, maintenance | `src/utils/complianceScore.js` (`calculateComplianceScore`: `checklistItems`, `overdueItems`, `expiringDocuments`, `expiredDocuments`, `mediaLogs`, `incidents`, `maintenanceTasks`), `src/services/dashboard.js`, `src/components/common/ScoreBreakdownModal.js` | **Done** | Permit/cert “overdue” is modeled as expiring/expired **documents** passed into score; open **severe** incidents and overdue **non-closed** maintenance tasks penalize; no separate certification SKU beyond documents. |
| 0–100 + green/yellow/red style status | `src/utils/complianceScore.js` (`getScoreDescription`), `src/screens/DashboardScreen.js`, `src/components/common/ScoreBreakdownModal.js`, `src/screens/InspectionReadinessScreen.js` | **Done** | Labels: Excellent / Good / Fair / Low (bands in `getScoreDescription`). |
| Dashboard insights / tips | `src/services/dashboard.js` (`buildReadinessSummary`), `src/screens/DashboardScreen.js` | **Done** | Narrative readiness copy is separate from the numeric `calculateComplianceScore` formula. |

---

## §6.6 Inspection Readiness & Reporting

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Inspection mode, date filters, aggregated views | `src/screens/InspectionReadinessScreen.js`, `src/services/dashboard.js` (`fetchDashboardSnapshot`) | **Partial** | Readiness screen aggregates snapshot data; not a separate global “mode” toggle across the app. |
| Export PDF | `src/utils/readinessExport.js` (`exportReadinessSummaryPdf` + dynamic `expo-print`), `src/screens/InspectionReadinessScreen.js` | **Done** | Client-generated PDF and share; depends on `expo-print` + user action. |
| Shareable report | `src/utils/readinessExport.js` (`shareReadinessSummary`, `generateReadinessPlaintext` / HTML helpers), `src/screens/InspectionReadinessScreen.js` | **Partial** | Native **Share** sheet (plaintext/HTML/PDF path); not a hosted multi-tenant report viewer. |
| Secure report link | `src/services/reportLinks.js` (`generateShareableReportLink`, `revokeShareableReportLink`), `src/screens/InspectionReadinessScreen.js` | **Partial** | Calls HTTPS Cloud Functions (`generateSecureReadinessReport` / `revokeSecureReadinessReport`); needs `extra.firebaseProjectId` in Expo config and deployed backend. |

---

## §6.7 Training & Certification Tracking

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Permits/certs as documents, expiry, upload | `src/screens/DocumentsScreen.js`, `src/screens/DocumentDetailScreen.js`, `src/services/storage.js`, `src/services/firestore.js` (documents), `src/utils/documentTypes.js` | **Partial** | Document model supports expiry and types; no separate “certification” module or auto-reminder push. |
| Reminders | — | **Missing** | No scheduled notifications (see `NOTIFICATIONS_SPIKE.md`). |
| Status tags Active / Expiring / Expired | Document list/detail UI + dashboard expiring/expired lists | **Partial** | Surfaced via dashboard/documents flows; wording may differ from PRD tags. |

---

## §6.8 Privacy & Public Visibility Controls

| PRD bullet | Primary implementation files | Status | Notes |
|------------|------------------------------|--------|--------|
| Public truck / score visibility, consent, default private | `src/screens/ProfileScreen.js` (“Public Visibility (Consent)” toggles, `handleVisibilityToggle`), `src/services/userProfile.js` (`updateUserVisibilitySettings`, `updateBusinessVisibilitySettings`) | **Partial** | Defaults private; persists user/business flags. In-app copy: flags are consent signals for future public API — **no** public read surface in app today. |

---

## Cross-cutting (PRD §7–8)

| Topic | Primary implementation files | Status | Notes |
|-------|------------------------------|--------|--------|
| Firestore security rules | `firestore.rules`, `storage.rules` | **Done** | Verify against live paths in `src/services/`. |
| Offline-first / sync SLA | `src/services/firebase.js` | **Partial** | Online-first MVP; persistence as enabled by SDK, not full offline-first product behavior. |
| Analytics (§9) | `src/services/analytics.js` (`logAnalyticsEvent`), `src/screens/ChecklistScreen.js`, `src/components/documents/UploadDocumentModal.js`, `src/screens/InspectionReadinessScreen.js`, `src/services/incidents.js` | **Partial** | Events: checklist completion, document upload, readiness share, incident created. Full funnel / screen coverage and production `@react-native-firebase/analytics` wiring depend on build type (see project analytics notes if present). |

---

## Navigation & entry (supports multiple §6 areas)

| Area | Files |
|------|--------|
| Auth vs onboarding vs main | `src/navigation/AppNavigator.js`, `src/navigation/AuthNavigator.js`, `src/navigation/OnboardingNavigator.js`, `src/navigation/MainNavigator.js`, `src/navigation/navigationConfig.js` |
| Deep linking config | `src/navigation/navigationConfig.js` (`DEEP_LINKING_CONFIG`) — product handling still partial |

---

*Last updated: 2026-04-15 — aligned to `src/` (PhoneLoginScreen, `reportLinks.js`, `readinessExport` + `expo-print`, Profile visibility toggles, `logAnalyticsEvent`, Incidents/Maintenance screens, `complianceScore.js` inputs). See also [`NAVIGATION_DOCUMENTATION.md`](../NAVIGATION_DOCUMENTATION.md) and [`CHECKLIST_DATA_AND_SCORING.md`](../CHECKLIST_DATA_AND_SCORING.md).*
