# Checklist Data Source & Compliance Scoring Logic

This document matches the **current** Expo + Firebase implementation. For PRD coverage vs code, see [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md).

---

## Checklist data source

### Where checklists come from

1. **Templates** live in Firestore `checklistTemplates` (global catalog). The app matches templates to the user using business profile context via:
   - `src/services/checklistTemplateSync.js`
   - `src/services/checklistFiltering.js`
2. **Instances** are user-scoped documents in Firestore **`checklistItems`**, created/updated through:
   - `src/services/checklistInstanceSync.js`
   - `src/services/checklistScheduling.js`

### Typical checklist item shape

Fields vary by template and writes from the UI, but instances commonly align with:

```javascript
{
  id: "auto-generated-id",
  userId: "user-uid",
  title: "Checklist item title",
  description: "Optional description",
  category: "FOOD_SAFETY", // or other category strings from templates/constants
  status: "pending", // pending, in_progress, completed, overdue (keep in sync with completed)
  completed: false,
  dueDate: "2026-01-23T09:00:00.000Z",
  completedAt: null,
  createdAt: "2026-01-20T10:00:00.000Z",
  updatedAt: "2026-01-20T10:00:00.000Z",
  priority: "high", // optional
  notes: "Optional notes",
  photos: [], // optional Storage URLs
}
```

### Data flow

1. **Owner completes onboarding** (minimum business profile) → template sync / instance generation can run (`userProfile.js`, onboarding screen).
2. **Checklist screen** loads and updates items via Firestore helpers in `src/services/firestore.js` and checklist services.
3. **Dashboard** loads a consolidated snapshot via `src/services/dashboard.js` (`fetchDashboardSnapshot`) plus score inputs from that snapshot.

### Real-time updates

Screens use listeners or refresh patterns built on `firestore.js` (for example `setupRealtimeListener` where used). Exact listener usage depends on the screen; favor unsubscribing on unmount per `Agents.md`.

### Query examples

Illustrative patterns (actual code may compose conditions differently):

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
- Queries should still filter by `userId` (or future `businessId`) so clients only request their data.

---

## Compliance scoring (v2) — current implementation

### Source of truth

**Numeric readiness score** is implemented in **`src/utils/complianceScore.js`**:

- Exported **`calculateComplianceScore`**
- Exported **`getScoreDescription`** (UI bands + copy)

### Formula (summary)

Let:

- **Base** = checklist completion percentage (0–100): completed items ÷ total items (0 if no items).
- **Overdue penalty** = min(40, 8 × overdue items) + min(18, 6 × critical overdue items).
- **Expiry penalty** = min(30, 3 × expiring-within-30-days docs + 10 × expired docs).
- **Incident penalty** = min(16, 4 × open severe incidents).
- **Maintenance penalty** = min(14, 3 × overdue maintenance tasks).
- **Media bonus** = 0, 5, or 10 based on media logs in the last 7 days (see file for thresholds).

Then:

```text
score = clamp(round(base - overduePenalty - expiryPenalty - incidentPenalty - maintenancePenalty + mediaBonus), 0, 100)
```

The function returns `score`, intermediate values, and a **`factors`** object (counts for UI and export).

### Consumers

| Location | Use |
|----------|-----|
| `src/screens/DashboardScreen.js` | Passes checklist/doc/media/incident/maintenance arrays from `fetchDashboardSnapshot` into `calculateComplianceScore`; shows score and breakdown entry points. |
| `src/screens/InspectionReadinessScreen.js` | Same score inputs for readiness + issue cards + share/export. |
| `src/components/common/ScoreBreakdownModal.js` | Uses `getScoreDescription` for labels/copy. |
| `src/utils/readinessExport.js` | Embeds score and factors in shared plaintext/HTML summaries. |

### Status bands (UI)

`getScoreDescription` maps **numeric score** to:

| Range | Label |
|-------|--------|
| ≥ 80 | Excellent |
| ≥ 60 | Good |
| ≥ 40 | Fair |
| &lt; 40 | Low |

### Constants

`src/constants/constants.js` defines **`COMPLIANCE_SCORE_THRESHOLDS`** (GOOD / AT_RISK / NON_COMPLIANT). The **primary** user-facing bands for the v2 score are **`getScoreDescription`** above; keep constants aligned if you reuse them elsewhere.

---

## Dashboard readiness narrative (separate from numeric score)

`src/services/dashboard.js` builds a **plain-language readiness summary** (`buildReadinessSummary`) inside `fetchDashboardSnapshot`: it uses counts (overdue, due today, expiring docs, document count, media presence) to produce **tone, title, message, and nextAction**. That narrative is **not** the same formula as `calculateComplianceScore`, but both are intentional: one for explanation, one for a single 0–100 number.

---

## Limitations vs full PRD §6.5

The PRD also mentions richer **certification** modeling. Incident severity and overdue maintenance backlog now contribute to score penalties, but certification-specific weighting is still not modeled. See [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md) §6.4–6.5.

Reasonable next enhancements (product-dependent):

1. Weight **critical** checklist items higher (needs reliable item metadata).
2. Deeper **certification** rules (required doc classes by state).
3. Historical score trend (new storage or aggregates).

---

## Performance notes

- Scoring is **O(n)** over lists passed in (checklists, overdue subset, documents, media logs).
- Runs on the client after snapshot fetch; no dedicated server-side aggregation.
