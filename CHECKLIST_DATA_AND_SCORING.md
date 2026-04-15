# Checklist Data Source & Compliance Scoring Logic

Matches **current** Expo + Firebase implementation. PRD vs code: [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md).

---

## Checklist data source

### Where checklists come from

1. **Templates** in Firestore `checklistTemplates` (catalog). Matched to the user via business profile context:
   - `src/services/checklistTemplateSync.js`
   - `src/services/checklistFiltering.js`
2. **Instances** in Firestore **`checklistItems`**, created/updated through:
   - `src/services/checklistInstanceSync.js`
   - `src/services/checklistScheduling.js`

### Typical checklist item shape

Fields vary by template and UI writes; instances often align with:

```javascript
{
  id: "auto-generated-id",
  userId: "user-uid",
  title: "Checklist item title",
  description: "Optional description",
  category: "FOOD_SAFETY",
  status: "pending",
  completed: false,
  dueDate: "2026-01-23T09:00:00.000Z",
  completedAt: null,
  createdAt: "2026-01-20T10:00:00.000Z",
  updatedAt: "2026-01-20T10:00:00.000Z",
  priority: "high", // optional; v2 score treats priority === "critical" on overdue rows only
  notes: "Optional notes",
  photos: [],
}
```

### Data flow

1. Owner completes onboarding → template sync / instance generation (`userProfile.js`, onboarding screen).
2. **Checklist screen** loads/updates via `src/services/firestore.js` and checklist services.
3. **Dashboard / readiness** load `fetchDashboardSnapshot` in `src/services/dashboard.js`; screens pass selected arrays into **`calculateComplianceScore`** (`src/utils/complianceScore.js`).

### Real-time updates

Screens use listeners or refresh patterns from `firestore.js` where applicable. Unsubscribe on unmount per `Agents.md`.

### Query examples

Illustrative patterns (code may compose differently):

#### Today’s items

```javascript
const conditions = [
  { field: 'userId', operator: '==', value: user.uid },
  { field: 'dueDate', operator: '>=', value: todayStart },
  { field: 'dueDate', operator: '<=', value: todayEnd },
];
const options = { orderBy: { field: 'dueDate', direction: 'asc' } };
queryDocuments('checklistItems', conditions, options);
```

#### Completed items

```javascript
const conditions = [
  { field: 'userId', operator: '==', value: user.uid },
  { field: 'completed', operator: '==', value: true },
];
const options = { orderBy: { field: 'completedAt', direction: 'desc' } };
queryDocuments('checklistItems', conditions, options);
```

### Security

- `firestore.rules` enforce auth-scoped access.
- Queries should still filter by `userId` (or future `businessId`).

---

## Compliance scoring (v2) — `calculateComplianceScore`

### Source of truth

**File:** `src/utils/complianceScore.js`

- **`calculateComplianceScore(params)`** — numeric 0–100 and breakdown.
- **`getScoreDescription(score)`** — label, description, color for UI bands.

### Inputs (as implemented)

All keys optional; default `[]`. Callers today are **`DashboardScreen.js`** and **`InspectionReadinessScreen.js`** after `fetchDashboardSnapshot`.

| Parameter | Meaning in code |
|-----------|-----------------|
| `checklistItems` | All checklist instances used for **completion %** = `completed` count ÷ length (0 if empty). |
| `overdueItems` | **Open** items with `dueDate` before start of today (subset built in `dashboard.js`). Penalty: **8** points each, cap **40**, plus **critical** add-on below. |
| `expiringDocuments` | Documents expiring within **30 days** from today (inclusive window in `dashboard.js`). **3** points each toward expiry penalty, cap **30** combined with expired. |
| `expiredDocuments` | Documents with `expiryDate` before today. **10** points each toward same **30** cap. |
| `mediaLogs` | Any array of logs with `createdAt` or `logDate`. **Bonus:** ≥1 log in last **7** days → +5; ≥3 → +10 (max 10). **`factors.recentMediaLogsCount`** counts logs in that window. **Note:** snapshot only passes **`recentMediaLogs`** (up to **four** newest logs) into this parameter from both screens — not the full `fetchMediaLogs` list. |
| `incidents` | Incident records. **Penalty:** each **open** (`status` not `resolved` / `closed`, case-insensitive) with `severity === 'severe'` (case-insensitive) costs **4** points, cap **16**. |
| `maintenanceTasks` | Maintenance tasks. **Penalty:** `dueDate` before today (midnight-normalized), **not** closed: `status` not `completed` / `resolved` / `closed` (case-insensitive). **3** points each, cap **14**. |

**Critical overdue:** On `overdueItems` only, items with **`priority === 'critical'`** add **6** points each to a **separate** critical bucket, cap **18**, on top of the per-item **8**/`40` base. Total overdue deduction = `min(40, 8×n) + min(18, 6×criticalCount)` (exposed split as `overdueBasePenalty` + `criticalOverduePenalty`; `overduePenalty` is their sum).

### Formula (single line)

```text
score = clamp(round(
  checklistCompletion
  - overduePenalty
  - expiryPenalty
  - openHighSeverityIncidentPenalty
  - overdueMaintenancePenalty
  + mediaBonus
), 0, 100)
```

### Return value (`calculateComplianceScore`)

Top-level (all numbers rounded/clamped as in source):

| Field | Description |
|-------|-------------|
| `score` | 0–100 |
| `checklistCompletion` | 0–100 completion % |
| `overduePenalty` | Base + critical overdue (0–58) |
| `overdueBasePenalty` | `min(40, 8 × overdueItems.length)` |
| `criticalOverduePenalty` | `min(18, 6 × criticalOverdueCount)` where `criticalOverdueCount` = overdue items with `priority === 'critical'`. |
| `expiryPenalty` | Document expiring/expired penalty (0–30) |
| `openHighSeverityIncidentPenalty` | Open + severe incidents (0–16) |
| `overdueMaintenancePenalty` | Overdue open maintenance (0–14) |
| `mediaBonus` | 0, 5, or 10 |
| `factors` | `{ totalChecklistItems, completedChecklistItems, overdueCount, criticalOverdueCount, expiringCount, expiredCount, openHighSeverityIncidentCount, overdueMaintenanceCount, recentMediaLogsCount }` |

### Consumers

| Location | Role |
|----------|------|
| `src/screens/DashboardScreen.js` | Loads `fetchDashboardSnapshot`, then `calculateComplianceScore` with `allChecklistItems`, `overdueItems`, document arrays, **`recentMediaLogs` as `mediaLogs`**, `incidents`, `maintenanceTasks`. |
| `src/screens/InspectionReadinessScreen.js` | Same pattern with optional date range on snapshot. |
| `src/components/common/ScoreBreakdownModal.js` | Uses `getScoreDescription` for bands/copy. |
| `src/utils/readinessExport.js` | Embeds score + `factors` in share/export text. |

---

## Dashboard readiness narrative vs numeric score

**Different code paths on purpose.**

1. **`buildReadinessSummary`** — private helper in **`src/services/dashboard.js`** (~lines 88–144). Called inside **`fetchDashboardSnapshot`**. Inputs: `totalDocuments`, `dueTodayCount`, `overdueCount`, `expiringCount`, `mediaLogCount` (length of **`recentMediaLogs`**, not full log history). It computes its own internal **`score`**, **`tone`**, **`title`**, **`message`**, **`nextAction`** for the dashboard “readiness card” copy. That internal score is **not** `calculateComplianceScore` and does **not** use incidents, maintenance, or checklist completion %.

2. **`calculateComplianceScore`** — `src/utils/complianceScore.js`. Used **only in screens** after snapshot load; **not** called inside `dashboard.js`.

UI may show **both** the narrative card (`data.readiness`) and the v2 breakdown (`scoreData` from `calculateComplianceScore`).

---

## Status bands (UI)

`getScoreDescription` maps numeric **score** to:

| Range | Label |
|-------|--------|
| ≥ 80 | Excellent |
| ≥ 60 | Good |
| ≥ 40 | Fair |
| < 40 | Low |

`src/constants/constants.js` defines **`COMPLIANCE_SCORE_THRESHOLDS`**. Primary v2 bands for the main score UI are **`getScoreDescription`**; keep constants aligned if reused elsewhere.

---

## Limitations vs PRD §6.5

Richer **certification** SKUs (beyond document expiry lists) are not separate in the formula. See [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md) §6.5–6.7.

Possible follow-ups: required-doc-type weights, historical score trend, pass **full** media log list into v2 if product wants bonus aligned with all evidence.

---

## Performance notes

Scoring is **O(n)** over arrays passed in. Runs on device after snapshot fetch; no server-side aggregation for v2.
