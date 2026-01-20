# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

- Purpose: Mobile document management and daily compliance checklists.
- Planned stack:
  - Mobile app: Expo React Native.
  - Backend: Node/Express.
  - Platform services: Firebase Auth, Firestore, and Storage.

As of now, this repository only contains documentation (`README.md`, `Agents.md`) and no application code or toolchain configuration.

## Commands and development workflow

Because there is currently no checked-in application code (no `package.json`, `Makefile`, or language-specific build files), there are **no project-specific build, lint, or test commands yet**.

When code is added, update this section with the concrete commands for:
- Starting the Expo development server for the mobile app (for example, from the app directory: `npx expo start`).
- Running the Node/Express backend in development mode.
- Linting and formatting (e.g., `npm run lint`, `npm run format`).
- Running the full test suite and a single test file or test case.

Until then, rely on the standard tooling for the stack you introduce (Expo CLI, Node/npm/yarn/pnpm, test runners like Jest/React Testing Library, etc.), and document the exact commands here once they are defined.

## High-level architecture expectations

The planned architecture, based on `Agents.md`, is:

- **Mobile client (Expo React Native)**
  - Uses **functional components and React hooks only**.
  - Local UI state stays within components; **shared/global state uses React Context**.
  - All **Firebase access goes through a `/services` layer**, not directly from screens/components.
  - Lists should use **`FlatList`**; apply **`React.memo`** to expensive components.
  - Styling with **`StyleSheet.create`**, and styles defined **at the bottom of each file**.
  - Naming:
    - Components: `PascalCase`.
    - Files: `camelCase` or `kebab-case`.
    - Constants: `UPPER_SNAKE_CASE`.

- **Backend (Node/Express)**
  - Provides APIs that complement Firebase (for business logic that does not fit neatly in Firestore rules or Cloud Functions).
  - Must validate and sanitize all incoming data before interacting with Firebase or other services.

- **Firebase (Auth/Firestore/Storage)**
  - Treated as the primary backend for auth, data, and file storage.
  - All access from the client goes through the `/services` abstractions.
  - Firestore and Storage security rules must be enforced and kept in sync with how data is used on the client and backend.

When new code is added, prefer a clear separation between:
- UI screens/components.
- Reusable UI primitives.
- Service layers for Firebase and other network access.
- Context providers for shared state.

## Implementation rules for the mobile app

These rules come from `Agents.md` and should be treated as hard requirements:

- **Components & state**
  - Use **functional components + hooks only** (no class components).
  - Prefer local component state where possible; use React Context for global/shared state.

- **Data & services**
  - Route **all Firebase calls through `/services`** modules.
  - Design services to be easily swappable with mock implementations for testing.

- **Lists & performance**
  - Use **`FlatList`** for rendering lists.
  - Use **`React.memo`** for components that are expensive to render or appear in large lists.
  - Debounce search inputs.
  - Paginate queries and batch writes to Firestore.

- **Styling & naming**
  - Use **`StyleSheet.create`** for styles.
  - Put styles **at the bottom of each file**.
  - Follow naming conventions:
    - Components in `PascalCase`.
    - Files in `camelCase` or `kebab-case`.
    - Constants in `UPPER_SNAKE_CASE`.

## Security, configuration, and runtime checks

From `Agents.md`:

- **Config & secrets**
  - Keep all Firebase configuration in `.env` files and ensure they are gitignored.
  - Do not hard-code secrets.

- **Firebase security**
  - Enforce **Firestore** and **Storage** security rules.
  - Use **Firebase App Check** when available.

- **Error handling & async flows**
  - Wrap async calls in `try/catch`.
  - Map `err.code` from Firebase and other services to user-friendly error messages.

- **Realtime and offline behavior**
  - Unsubscribe all realtime listeners on unmount/cleanup.
  - Enable Firestore offline persistence.
  - Handle sync errors and surface appropriate UI feedback.

- **Files & uploads**
  - Validate file size and type before upload.
  - Show upload progress and error states.

- **Accessibility**
  - Provide `accessibilityLabel` on interactive elements.

## Mock data

- Use `/utils/mockData.js` whose shape matches the Firestore schema so that the app can easily swap between live Firestore data and local mock data.

## Workflow and agent behavior

These guidelines are specifically for agents (including Warp) working in this repo:

- Start simple and implement **one feature at a time**.
- **Ask before making major architecture changes** or introducing new frameworks.
- If you must deviate from the guidelines above, **document the deviation** clearly in PR descriptions or commit messages.

### Project priorities

According to `Agents.md`, next priorities are:
1. Authentication screens.
2. Main navigation.
3. Dashboard using mock data.

When implementing these, ensure you respect the architecture and rules above and then update this `WARP.md` with concrete commands and structure once code exists.