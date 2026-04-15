# MVP “100%” — full gap list + agent prompts

**Caveman TL;DR:** “100%” = branch MVP story **done + honest docs + rules match code + ship quality (test/CI/a11y) + PRD gaps you still want (phone prod, push, deep links, cert weight). Not same as infinite polish. Use prompts below; reuse [`IMPLEMENTATION_PHASES_PROMPTS.md`](IMPLEMENTATION_PHASES_PROMPTS.md) where noted.

---

## 0) Pick definition of “100%”

| Bar | Meaning |
|-----|--------|
| **A — Branch MVP (recommended)** | [`BRANCH_PRODUCT_REFINEMENT_GUIDE.md`](../BRANCH_PRODUCT_REFINEMENT_GUIDE.md) §8–9: owner journey, checklists, docs, media, dashboard, readiness, score, share/PDF, basic team/incidents/maintenance, visibility toggles, `businessId` path solid, no lying docs. |
| **B — Literal PRD §6** | Everything in root [`PRD.md`](../PRD.md) §6 including push reminders, full offline-first SLA, regulator flows, multi-truck enterprise — **much post-MVP**. |
| **C — Ship engineering** | A + automated tests + CI + rules audit + deep links productized + production Firebase (App Check, Crashlytics optional). |

**Default path below:** **A + C** (product MVP + ship bar). Mark **B-only** items separately at end.

**Repository context (prepend to every prompt)**

```text
Repository: internal-aggregator-app — Expo RN + Firebase (Auth, Firestore, Storage). All Firebase via src/services/. Functional components + hooks; StyleSheet bottom of file. Follow Agents.md. Run npm run lint after edits.
```

---

## 1) Documentation truth (do first — unblocks “done”)

| ID | Gap | Done when |
|----|-----|-----------|
| **TRACE-01** | [`PRD_TRACEABILITY.md`](PRD_TRACEABILITY.md) stale vs code (phone screen exists, PDF + share link flows exist, analytics wired, visibility in Profile, incidents/maintenance screens). | Table matches `src/`; statuses updated. |

**Prompt TRACE-01**

```text
Repository: internal-aggregator-app.

Goal: Refresh docs/PRD_TRACEABILITY.md against current src/: grep PhoneLoginScreen, reportLinks.js, readinessExport expo-print, ProfileScreen visibility toggles, logAnalyticsEvent usages, IncidentsScreen/MaintenanceTasksScreen, complianceScore.js inputs. Update every row status + file paths + notes. Remove false "Missing" where feature exists. Keep legend. No scope change to PRD.md body except optional one-line pointer to this checklist.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **NAV-01** | [`NAVIGATION_DOCUMENTATION.md`](../NAVIGATION_DOCUMENTATION.md) vs `MainNavigator.js` (hidden tabs, Incidents/Maintenance stacks, phone route). | Doc tree matches navigator. |

**Prompt NAV-01**

```text
Repository: internal-aggregator-app.

Goal: Update NAVIGATION_DOCUMENTATION.md to match AppNavigator, AuthNavigator (include PhoneLogin), OnboardingNavigator, MainNavigator (all Tab.Screen entries including hidden routes tabBarButton: null). Deep link table matches navigationConfig.js. Manual test checklist updated.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **CHKDOC-01** | [`CHECKLIST_DATA_AND_SCORING.md`](../CHECKLIST_DATA_AND_SCORING.md) vs `complianceScore.js` + dashboard narrative. | Single source of truth; critical/incident/maintenance factors if present in score. |

**Prompt CHKDOC-01**

```text
Repository: internal-aggregator-app.

Goal: Update CHECKLIST_DATA_AND_SCORING.md to describe calculateComplianceScore inputs/outputs as implemented (including critical priority, incidents, maintenance if in code). Point to dashboard.js buildReadinessSummary separation. Remove obsolete lines.
```

---

## 2) Auth & sessions

| ID | Gap | Done when |
|----|-----|-----------|
| **AUTH-PHONE-01** | Phone login screen exists; **production** needs Recaptcha verifier config, SHA keys (Android), APNs if needed, error UX, optional disable flag if not supported in Expo Go. | Works on real device build; docs in FIREBASE_SETUP.md. |

**Prompt AUTH-PHONE-01**

```text
Repository: internal-aggregator-app.

Goal: Production-harden PhoneLoginScreen + auth.js: document Firebase Console phone auth steps; app.config.js / native config for reCAPTCHA; map Firebase errors to friendly strings; loading states; skip or gate flow when native module missing (clear message). Update FIREBASE_SETUP.md with exact steps. No secrets in repo.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **AUTH-ROLE-01** | `useEffectiveRole` + `businessMembers` exist; **every** sensitive screen/action should respect owner vs staff (not only Staff tab). | Audit + gates consistent. |

**Prompt AUTH-ROLE-01**

```text
Repository: internal-aggregator-app.

Goal: Audit all screens that write business-scoped data (checklist, documents, incidents, maintenance, visibility, invite). Enforce owner-only or staff-allowed via useEffectiveRole + navigation options + UI disable. Document matrix in comment or docs/ROLE_MATRIX.md. Firestore rules must match (coordinate with RULES-02).
```

---

## 3) Firestore rules, Storage, App Check

| ID | Gap | Done when |
|----|-----|-----------|
| **RULES-02** | Rules must match **all** collections paths used in `src/services/` including `businesses`, `businessMembers`, `incidents`, `maintenanceTasks`, report link artifacts if any. | Audit doc + rule patches; staging test. |

**Prompt RULES-02**

```text
Repository: internal-aggregator-app.

Goal: Grep src/services for collection names + Storage paths. Compare firestore.rules + storage.rules. Fix mismatches. Add comments in rules for businessId vs userId fallback. Do not weaken auth. Summarize in docs/RULES_AUDIT.md or PR description.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **APPCHECK-01** | PRD / security asks App Check when available. | Enabled for prod with dev bypass documented. |

**Prompt APPCHECK-01**

```text
Repository: internal-aggregator-app.

Goal: Add Firebase App Check for Firestore/Storage in firebase.js (or service init) with Expo-compatible approach; document debug token flow for dev; production enforcement documented only if build supports it—otherwise document deferral.
```

---

## 4) Core product — close “Partial” rows

These **overlap** [`IMPLEMENTATION_PHASES_PROMPTS.md`](IMPLEMENTATION_PHASES_PROMPTS.md): run **P0-A, P0-B, P0-C, P0-E** first, then **P1-A, P1-B**, then **P3**–**P5** as your bar requires.

| Topic | Phase prompts |
|-------|----------------|
| Checklist write consistency + critical weight + doc badges + rules audit | **P0-A, P0-B, P0-C, P0-E** |
| Readiness date filter + inspection mode UI | **P1-A, P1-B** |
| PDF + share (client) | **P1-C, P1-D** (verify already merged; run prompt only if gaps) |
| `businessId` + members + staff UX | **P3-A through P3-D** |
| Incidents + maintenance depth + score | **P4-A through P4-D** |
| In-app reminders + required doc matrix + push optional | **P5-A through P5-C** |
| Visibility + optional public read API | **P6-A, P6-B** |

**Prompt GAP-AUDIT-01** (single pass before deep work)

```text
Repository: internal-aggregator-app.

Goal: Read-only audit: list each PRD_TRACEABILITY "Partial" row, open referenced files, note actual behavior vs doc. Output markdown table in PR description or docs/MVP_GAP_AUDIT.md. No code change in this task unless trivial typo.
```

---

## 5) Secure report links & Cloud Functions

| ID | Gap | Done when |
|----|-----|-----------|
| **CF-LINK-01** | Client has `reportLinks.js` + UI; **firebase/functions/index.js** must implement/revoke links, TTL, auth, Storage layout; deployed + env wired. | E2E: generate → open → expire → revoke. |

**Prompt CF-LINK-01**

```text
Repository: internal-aggregator-app + firebase/functions.

Goal: Implement callable/HTTPS endpoints used by src/services/reportLinks.js: create signed report (HTML or PDF blob in Storage), store metadata (owner uid, businessId, expiresAt), return URL; revoke deletes metadata + invalidates URL. Match client API exactly. Add minimal integration test or manual runbook in docs/SECURE_REPORT_LINKS.md. Lock down CORS and auth.
```

---

## 6) Deep linking & distribution

| ID | Gap | Done when |
|----|-----|-----------|
| **DL-01** | `DEEP_LINKING_CONFIG` exists; cold start + logged-in routing not fully verified per platform. | Matrix tested iOS/Android. |

**Prompt DL-01**

```text
Repository: internal-aggregator-app.

Goal: Wire app.config.js scheme + associatedDomains if iOS universal links; handle edge cases in AppNavigator (unknown path → Dashboard). Document test commands in NAVIGATION_DOCUMENTATION.md. Test: foodtruckcompliance://readiness, phone-login, documents/detail/:id.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **EAS-01** | EAS build profiles, env injection, store listing prep. | `eas.json` + secrets doc internal only. |

**Prompt EAS-01**

```text
Repository: internal-aggregator-app.

Goal: Add or update eas.json profiles (development, preview, production). Document EAS secrets for Firebase env vars. No keys in git. Link to Expo docs in README section "Ship".
```

---

## 7) Analytics & observability

| ID | Gap | Done when |
|----|-----|-----------|
| **AN-01** | Events fired from several screens; **catalog + naming convention + no-op in dev** policy unified. | docs/ANALYTICS_EVENTS.md matches code; DebugView verified on dev client build. |

**Prompt AN-01**

```text
Repository: internal-aggregator-app.

Goal: Inventory every logAnalyticsEvent call; dedupe names; document in docs/ANALYTICS_EVENTS.md. Ensure analytics.js fails soft in Expo Go; document production requirement (@react-native-firebase/analytics + dev build). Add missing high-value events (screen_view for main tabs, incident_view) if trivial.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **CRASH-01** | Optional Crashlytics/Sentry. | Either integrated or explicitly deferred in README. |

---

## 8) Offline & resilience (honest MVP)

| ID | Gap | Done when |
|----|-----|-----------|
| **OFF-01** | PRD offline-first not true on RN JS SDK; user copy + retry patterns must be consistent. | Copy + retry on snapshot failures; README says online-first. |

**Prompt OFF-01**

```text
Repository: internal-aggregator-app.

Goal: Audit DashboardScreen, ChecklistScreen, DocumentsScreen for Firestore errors; show same friendly offline/retry pattern. README "Offline" section: online-first, persistence limits. No fake offline-first marketing.
```

---

## 9) Ship quality — tests, CI, lint gate

| ID | Gap | Done when |
|----|-----|-----------|
| **TEST-01** | Jest smoke minimal; need critical path tests (auth guard, onboarding gate, score calc pure fn). | Tests pass; `npm test` in CI. |

**Prompt TEST-01**

```text
Repository: internal-aggregator-app.

Goal: Add jest tests: (1) complianceScore.js pure fn cases with fixtures; (2) shouldShowOwnerOnboarding or userProfile helper with mock profiles; (3) navigation guard smoke via shallow or @testing-library/react-native if already set up. Keep fast. No network.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **CI-01** | Lint clean; add `--max-warnings 0` optional; GitHub Actions / other CI runs lint + test. | Green CI on PR. |

**Prompt CI-01**

```text
Repository: internal-aggregator-app.

Goal: Add .github/workflows/ci.yml (or equivalent): checkout, npm ci, npm run lint (optionally --max-warnings 0), npm test. Use Node LTS. Cache npm. Document in README badge optional.
```

---

## 10) UX, a11y, performance

| ID | Gap | Done when |
|----|-----|-----------|
| **A11Y-01** | `ACCESSIBILITY_CHECKLIST.md` vs main flows. | High-traffic screens pass checklist. |

**Prompt A11Y-01**

```text
Repository: internal-aggregator-app.

Goal: Per ACCESSIBILITY_CHECKLIST.md, pass Dashboard, Checklist, Documents, MediaLogScreen, InspectionReadinessScreen, Profile: accessibilityLabel on icon buttons, focus order, contrast. Fix worst gaps first.
```

| ID | Gap | Done when |
|----|-----|-----------|
| **PERF-01** | Large lists: pagination / `FlatList` `windowSize` / avoid heavy re-renders. | No jank on 500+ checklist items test data. |

**Prompt PERF-01**

```text
Repository: internal-aggregator-app.

Goal: DocumentsScreen + ChecklistScreen FlatList tuning: keyExtractor stable, getItemLayout if fixed height, initialNumToRender, maxToRenderPerBatch. Paginate Firestore queries where feasible. Document limits in PERFORMANCE_OPTIMIZATION.md.
```

---

## 11) Optional “PRD literal B” items (explicitly post-MVP unless you want them in 100%)

| ID | Item |
|----|------|
| **B-PUSH** | Scheduled push + email reminders (Cloud Functions + FCM) — see **P5-C**, `NOTIFICATIONS_SPIKE.md`. |
| **B-OFFLINE** | True offline queue / native Firebase — large; separate spike. |
| **B-REG** | Regulator portal, public compliance map — out of branch MVP. |
| **B-MULTI** | Multi-truck enterprise accounts — RFC scale work. |

**Stakeholder decision (B-SCOPE-01) — recorded**

- **v1.0 “100%” bar:** **A + C** only; **no** B-PUSH / B-OFFLINE / B-REG / B-MULTI in v1.0 unless the table in [`roadmap.md`](../roadmap.md) is updated.
- **Roadmap:** deferred B-items and quarters live in [`roadmap.md`](../roadmap.md).
- **Engineering:** follow **A + C** until product edits `roadmap.md` § “v1.0 tag — B-items in 100%?”.

**Prompt B-SCOPE-01** (product decision only)

```text
Stakeholder task (no code): Mark which B-items enter "100%" for v1.0 tag. Everything else → roadmap.md with quarter. Engineering follows A+C only until decision changes.
```

---

## 12) Execution order (suggested)

1. **TRACE-01, NAV-01, CHKDOC-01** — stop doc lie.  
2. **RULES-02 + AUTH-ROLE-01** — trust + access.  
3. **IMPLEMENTATION phases P0 → P1** — tighten product.  
4. **CF-LINK-01** if secure links part of 100%.  
5. **DL-01, EAS-01** — ship path.  
6. **AN-01, OFF-01** — honesty + metrics.  
7. **TEST-01, CI-01, A11Y-01, PERF-01** — bar.  
8. **P3–P5** from phase doc if team model + incidents depth + reminders in scope.  
9. **B-SCOPE-01** then **B-*** prompts only if product expands bar.

---

## 13) Already have prompt library elsewhere

| Doc | Contents |
|-----|----------|
| [`IMPLEMENTATION_PHASES_PROMPTS.md`](IMPLEMENTATION_PHASES_PROMPTS.md) | **P0–P7** granular prompts (checklist sync, score, readiness, `businessId`, incidents, maintenance, visibility, phone, analytics spike, etc.). |

**Do not duplicate:** use **this file** for “what’s left + doc/ship/analytics/deep link/100% definition”; use **phase file** for step-by-step implementation prompts already written.

---

*When TRACE-01 done, delete or archive contradictory bullets in old reviews. Single source: PRD_TRACEABILITY + this checklist.*
