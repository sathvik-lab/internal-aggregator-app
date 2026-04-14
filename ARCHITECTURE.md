# ARCHITECTURE.md

## Overview

This repository contains a mobile app built with **Expo React Native** and a **Firebase-first backend**. The current architecture uses:

- **Firebase Auth** for sign-in, sign-up, password reset, and auth state observation
- **Cloud Firestore** for user profiles, checklist data, documents metadata, and media log records
- **Firebase Storage** for uploaded compliance documents and media assets

This branch does **not** use Supabase.

## Client Architecture

The app entrypoint is `App.js`. It initializes the provider stack and then hands control to React Navigation:

- `ThemeProvider`
- `react-native-paper` provider
- `AuthProvider`
- `AppNavigator`

Most product code lives in `src/`:

- `src/screens/` contains top-level screens
- `src/components/` contains reusable UI
- `src/navigation/` contains auth and authenticated navigation
- `src/context/` contains shared app state such as auth and theme
- `src/services/` contains all Firebase access and backend-facing logic

## Navigation

Navigation is split into authenticated and unauthenticated flows:

- `AuthNavigator`
  - Login
  - Signup
  - Forgot Password
- `MainNavigator`
  - Dashboard
  - Documents
  - Checklist
  - Profile
  - Logs

The Documents tab uses a stack navigator so the app can move from the documents list into document detail screens while staying inside the main authenticated experience.

## Services Layer Rule

Firebase calls belong in `src/services/`, not in components or screen UI code.

That rule keeps the UI layer focused on rendering, state transitions, loading states, and user interaction. It also keeps Firebase concerns centralized for:

- auth state handling
- Firestore CRUD and query helpers
- Storage uploads and deletes
- checklist sync and filtering logic
- media log workflows

The intended dependency direction is:

`screens/components -> context/hooks -> services -> Firebase SDK`

## Data Model

The main Firestore collections used on this branch are:

### `users`

Per-user profile and app metadata. This is the anchor record for authenticated users and is referenced across profile, onboarding, and checklist/template matching logic.

Typical responsibilities:

- profile details
- business metadata
- settings and derived status fields

### `checklistTemplates`

Global checklist template definitions that can be matched to users based on business and compliance context. Templates are read by the app and used to generate or sync actionable checklist instances.

Typical responsibilities:

- template metadata
- category and compliance area info
- recurrence/scheduling inputs
- filtering metadata for assigning relevant templates

### `checklistItems`

User-facing checklist instances and custom checklist entries. This collection powers checklist completion, due-date tracking, dashboard readiness indicators, and compliance scoring inputs.

Typical responsibilities:

- completion state
- due dates
- template linkage
- checklist status per user

### `documents`

Metadata for uploaded compliance documents. Files themselves live in Firebase Storage, while Firestore stores the searchable business record.

Typical responsibilities:

- document name and category
- owner/user linkage
- upload date and status
- Storage path or download URL references

### `mediaLogs`

Photo/video log metadata for operational evidence and incident history. As with documents, the binary asset is stored in Firebase Storage and Firestore keeps the structured record.

Typical responsibilities:

- media type and notes
- owner/user linkage
- timestamps
- Storage references

## Storage

Firebase Storage is used for binary uploads such as:

- compliance documents
- photos
- videos

The app stores file metadata in Firestore and binary content in Storage. This keeps the document/media experience queryable without putting large file payloads into Firestore.

## Auth Flow

Authentication is handled through Firebase Auth and surfaced to the app through `AuthContext`.

At a high level:

1. The app initializes Firebase.
2. `AuthProvider` subscribes to auth state changes.
3. `AppNavigator` switches between auth screens and the main app based on whether a user is signed in.
4. Screens and services use the authenticated user ID to query scoped Firestore data.

## Known Gaps And Near-Term Work

### `businessId` migration

The codebase already references business-level concepts, but branch-wide data ownership is still transitioning from user-only assumptions toward a stronger business-scoped model. A `businessId` migration is still a known gap and should be treated as active architecture work, especially for:

- owner onboarding
- team access
- shared business records
- checklist and document scoping

### Cloud Functions

Cloud Functions are not part of the current implemented branch architecture, but they are the expected future place for backend jobs that should not live in the client.

Likely future uses:

- reminders and scheduled notifications
- exports and report generation
- heavier background sync or aggregation work
- business-level automation

## Practical Guidance

- Keep Firebase SDK usage in `src/services/`
- Keep screens focused on rendering and orchestration
- Continue treating Firebase as the source of truth for auth, data, and files
- Avoid introducing Supabase-specific assumptions into docs or implementation
