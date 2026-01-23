# Checklist Data Source & Compliance Scoring Logic

## 📋 Checklist Data Source

### Where Checklists Come From

Checklists are stored in **Firestore** in the `checklistItems` collection. Each checklist item has the following structure:

```javascript
{
  id: "auto-generated-id",
  userId: "user-uid",           // Links item to user
  title: "Checklist item title",
  description: "Optional description",
  category: "FOOD_SAFETY",      // Category type
  status: "pending",             // pending, in_progress, completed, overdue
  completed: false,             // Boolean completion flag
  dueDate: "2026-01-23T09:00:00.000Z",  // ISO date string
  completedAt: null,            // ISO date when completed (or null)
  createdAt: "2026-01-20T10:00:00.000Z",
  updatedAt: "2026-01-20T10:00:00.000Z",
  priority: "high",             // Optional: high, medium, low
  notes: "Optional notes",       // Optional notes field
  photos: []                     // Optional array of photo URLs
}
```

### Data Flow

1. **User Creates Checklist Item**:
   - User opens "Add Checklist Item" modal
   - Fills in title, category, due date, etc.
   - Item is saved to Firestore `checklistItems` collection
   - `userId` field is automatically set to current user's UID

2. **Fetching Checklists**:
   - **Dashboard**: Fetches incomplete items due today
   - **Checklist Screen**: Fetches all items filtered by:
     - Today's items (due date = today)
     - Upcoming items (due date > today)
     - Completed items (completed = true)

3. **Real-time Updates**:
   - Uses `setupRealtimeListener()` from `firestore.js`
   - Automatically updates UI when items change
   - No manual refresh needed

### Query Examples

#### Get Today's Items
```javascript
const conditions = [
  { field: 'userId', operator: '==', value: user.uid },
  { field: 'dueDate', operator: '>=', value: todayStart },
  { field: 'dueDate', operator: '<=', value: todayEnd },
];
const options = { orderBy: { field: 'dueDate', direction: 'asc' } };
queryDocuments('checklistItems', conditions, options);
```

#### Get Pending Items
```javascript
const conditions = [
  { field: 'userId', operator: '==', value: user.uid },
  { field: 'completed', operator: '==', value: false },
  { field: 'status', operator: '==', value: 'pending' },
];
queryDocuments('checklistItems', conditions);
```

#### Get Completed Items
```javascript
const conditions = [
  { field: 'userId', operator: '==', value: user.uid },
  { field: 'completed', operator: '==', value: true },
];
const options = { orderBy: { field: 'completedAt', direction: 'desc' } };
queryDocuments('checklistItems', conditions, options);
```

### Security

- All queries automatically filter by `userId == request.auth.uid`
- Security rules in `firestore.rules` enforce user isolation
- Users can only see/modify their own checklist items

---

## 🎯 Compliance Scoring Logic

### Current Implementation

The compliance score is calculated in `DashboardScreen.js` using this formula:

```javascript
// Step 1: Calculate checklist completion rate
const totalChecklists = checklistItems.length;
const completedChecklists = checklistItems.filter((item) => item.completed).length;
const completionRate = totalChecklists > 0 
  ? (completedChecklists / totalChecklists) * 100 
  : 0; // Return 0 when no checklists exist, not 100

// Step 2: Calculate compliance score
const complianceScore = Math.round(
  completionRate * 0.7 +           // 70% weight on checklist completion
  (totalDocuments > 0 ? 30 : 0)    // 30% bonus if user has documents
);
```

### Formula Breakdown

**Score = (Completion Rate × 70%) + (Documents Bonus × 30%)**

Where:
- **Completion Rate** = (Completed Checklists / Total Checklists) × 100
- **Documents Bonus** = 30 points if user has at least 1 document, else 0

### Examples

#### Example 1: Perfect Score
- Total checklists: 10
- Completed: 10
- Documents: 5
- **Calculation**:
  - Completion rate: (10/10) × 100 = 100%
  - Score: (100 × 0.7) + 30 = **100**

#### Example 2: Good Score
- Total checklists: 10
- Completed: 8
- Documents: 3
- **Calculation**:
  - Completion rate: (8/10) × 100 = 80%
  - Score: (80 × 0.7) + 30 = **86**

#### Example 3: At Risk
- Total checklists: 10
- Completed: 5
- Documents: 2
- **Calculation**:
  - Completion rate: (5/10) × 100 = 50%
  - Score: (50 × 0.7) + 30 = **65**

#### Example 4: No Documents
- Total checklists: 10
- Completed: 10
- Documents: 0
- **Calculation**:
  - Completion rate: (10/10) × 100 = 100%
  - Score: (100 × 0.7) + 0 = **70**

### Score Thresholds

Defined in `src/constants/constants.js`:

```javascript
export const COMPLIANCE_SCORE_THRESHOLDS = {
  GOOD: 80,        // Green status (80-100)
  AT_RISK: 60,     // Yellow status (60-79)
  NON_COMPLIANT: 0, // Red status (0-59)
};
```

### Status Display

- **80-100**: "Good" (Green) ✅
- **60-79**: "At Risk" (Yellow) ⚠️
- **0-59**: "Needs Attention" (Red) ❌

---

## 🔄 Current Limitations & Future Enhancements

### Current Limitations

1. **Simple Formula**: Only considers checklist completion and document count
2. **No Overdue Penalty**: Overdue items don't reduce score
3. **No Time Weighting**: Recent completions count same as old ones
4. **No Category Weighting**: All checklist items count equally
5. **No Incident Impact**: Incidents don't affect score (not implemented yet)

### Proposed Enhancements (from PRD)

The PRD suggests a more comprehensive scoring system:

```javascript
// Future enhanced scoring (not yet implemented)
const calculateComplianceScore = (data) => {
  const {
    checklistCompletionRate,    // Weight: 40%
    incidentSeverity,            // Weight: 25%
    certificationStatus,          // Weight: 20%
    maintenanceBacklog,          // Weight: 15%
  } = data;

  let score = 0;
  
  // Checklist completion (40%)
  score += checklistCompletionRate * 0.4;
  
  // Incident severity (25%) - penalties for incidents
  score += (100 - incidentSeverity) * 0.25;
  
  // Certification status (20%) - all active = 100
  score += certificationStatus * 0.2;
  
  // Maintenance backlog (15%) - no backlog = 100
  score += (100 - maintenanceBacklog) * 0.15;
  
  return Math.round(Math.max(0, Math.min(100, score)));
};
```

### Factors to Consider (Future)

1. **Overdue Items**: Reduce score for overdue checklists
2. **Critical Items**: Weight critical items higher
3. **Recent Activity**: Boost score for recent completions
4. **Incident History**: Penalize for recent incidents
5. **Certification Status**: Factor in expired certifications
6. **Time Decay**: Older completions count less over time

---

## 📊 Where Scores Are Used

### Dashboard Screen
- **StatCard**: Shows compliance score with color-coded status
- **Updated**: Recalculated when dashboard refreshes
- **Real-time**: Updates when checklist items change

### Profile Screen (Future)
- Could show historical score trends
- Could show score improvement over time

### Reports (Future)
- Could include score in inspection reports
- Could show score breakdown by category

---

## 🛠️ Implementation Details

### Location
- **Scoring Logic**: `src/screens/DashboardScreen.js` (lines 117-122)
- **Thresholds**: `src/constants/constants.js` (lines 58-63)
- **Display**: `src/screens/DashboardScreen.js` (lines 445-452)

### When Score Updates
1. **On Dashboard Load**: Calculated when dashboard opens
2. **On Pull-to-Refresh**: Recalculated on manual refresh
3. **Real-time**: Could update when checklist items change (if listener added)

### Performance
- Calculation is fast (O(n) where n = number of checklist items)
- Runs client-side (no server calls needed)
- Cached in component state until refresh

---

## 📝 Summary

### Checklist Data
- ✅ Stored in Firestore `checklistItems` collection
- ✅ Filtered by `userId` for security
- ✅ Real-time updates via Firestore listeners
- ✅ Queried by date, status, completion

### Scoring Logic
- ✅ Simple formula: (Completion Rate × 70%) + (Documents Bonus × 30%)
- ✅ Score range: 0-100
- ✅ Status thresholds: Good (80+), At Risk (60-79), Needs Attention (<60)
- ⚠️ Limited factors (only completion + documents)
- 🔄 Future: More comprehensive scoring with incidents, certifications, etc.

### Next Steps
1. Add overdue item penalties
2. Add category weighting
3. Add incident impact
4. Add certification status
5. Add time-based weighting
