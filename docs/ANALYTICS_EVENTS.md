# Analytics Events

All analytics go through `src/services/analytics.js`. Custom events use `logAnalyticsEvent`; tab-level navigation uses `logScreenView` (Firebase `logScreenView` API → appears as `screen_view` in DebugView).

## Production vs Expo Go

| Environment | Behavior |
|-------------|----------|
| **EAS / `expo run:*` dev build** | `@react-native-firebase/analytics` native module present → events send when Firebase configured. |
| **Expo Go** (`Constants.executionEnvironment === 'storeClient'`) | No native RNFirebase Analytics. `getAnalytics()` returns `null` immediately (no `require` of native module) → **silent no-op**. No crash; no repeated require failures. |

Ship real analytics only in a **development or production build** that includes `@react-native-firebase/analytics` and your Firebase iOS/Android configs. Use Firebase **DebugView** on a dev build to verify.

## Custom events (`logEvent`)

Unique event **names** (deduped catalog). Same name may fire from multiple code paths with different params.

| Event name | Where | When | Params |
|------------|-------|------|--------|
| `checklist_item_completed` | `src/screens/ChecklistScreen.js` | User marks item complete (not on un-complete) | `item_id`, `priority`, `source` (`checklist_screen`) |
| `document_uploaded` | `src/components/documents/UploadDocumentModal.js` | Firestore document row created after successful upload | `document_id`, `document_type`, `source` (`upload_document_modal`) |
| `readiness_share` | `src/screens/InspectionReadinessScreen.js` | After successful share text **or** PDF export | `format` (`text` \| `pdf`), `source` (`inspection_readiness`) |
| `incident_created` | `src/services/incidents.js` | After incident doc created in Firestore | `incident_id`, `severity`, `type`, `source` (`incidents_service`), `phase` (`stub`) |
| `incident_view` | `src/screens/IncidentDetailScreen.js` | Once per loaded `incidentId` when detail data present | `incident_id`, `severity`, `type`, `source` (`incident_detail_screen`) |

## Screen views (`logScreenView`)

- **Wiring:** `src/navigation/AppNavigator.js` `NavigationContainer` `onStateChange` → `getActiveRouteName(state)` (deepest focused route) → `logScreenView(activeRouteName)`.
- **Allowlist:** Only routes that map to a name in `LOGGABLE_TAB_SCREENS` in `analytics.js` are logged.
- **Tab mapping:** Nested stack routes collapse to a **logical tab** so list ↔ detail inside one tab does not emit duplicate `screen_view` until user leaves that tab.

| Deepest route (`activeRouteName`) | `screen_name` / `screen_class` |
|-----------------------------------|-------------------------------|
| `Dashboard`, `Documents`, `Checklist`, `Profile`, `MediaLogs`, `InspectionReadiness`, `Incidents`, `Maintenance` | Same name (tab) |
| `DocumentsList`, `DocumentDetail` | `Documents` |
| `ProfileMain`, `Staff` | `Profile` |
| `IncidentsList`, `IncidentDetail` | `Incidents` |
| `MaintenanceList`, `MaintenanceDetail` | `Maintenance` |

`screen_class` is always `MainTabs` for these.

Auth stack, onboarding, and other routes outside the allowlist do not log tab `screen_view` from this helper.

## DebugView checklist

1. Run iOS/Android **dev client** (not Expo Go): `expo run:ios`, `expo run:android`, or EAS build with native Firebase.
2. Enable [Analytics DebugView](https://firebase.google.com/docs/analytics/debugview) for the device.
3. Exercise flows above + switch main tabs (including Documents list/detail, Incidents, Maintenance).
