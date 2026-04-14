# Analytics Events

This app uses `@react-native-firebase/analytics` (Expo dev build / EAS build) through `src/services/analytics.js`.

## Event Catalog

### `checklist_item_completed`
- Trigger: checklist item marked complete from checklist UI
- Params:
  - `item_id` (string)
  - `priority` (string)
  - `source` (string, `checklist_screen`)

### `document_uploaded`
- Trigger: document upload flow completes successfully
- Params:
  - `document_id` (string)
  - `document_type` (string)
  - `source` (string, `upload_document_modal`)

### `readiness_share`
- Trigger: readiness summary shared as text or PDF
- Params:
  - `format` (string, `text` or `pdf`)
  - `source` (string, `inspection_readiness`)

### `incident_created`
- Trigger: incident created successfully
- Params:
  - `incident_id` (string)
  - `severity` (string)
  - `type` (string)
  - `source` (string, `incidents_service`)
  - `phase` (string, `stub`)

### `screen_view`
- Trigger: active main tab changes
- Logged via `analytics().logScreenView(...)`
- Tracked screen names:
  - `Dashboard`
  - `Documents`
  - `Checklist`
  - `Profile`
  - `MediaLogs`
  - `InspectionReadiness`

## Verification (DebugView)

1. Build and run a native dev build (`expo run:ios`, `expo run:android`, or EAS dev build).
2. Trigger events in app flows above.
3. Open Firebase Analytics DebugView and verify incoming events.
