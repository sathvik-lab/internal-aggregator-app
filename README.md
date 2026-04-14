# internal-aggregator-app

Expo React Native app for mobile document management and daily compliance checklists, backed by Firebase Authentication, Firestore, and Storage.

## Current Branch Status

This branch contains application code. The app entrypoint is `App.js`, most product code lives under `src/`, and Firebase is the primary backend integration via the service layer in `src/services/`.

## App Structure

- `App.js` sets up providers and navigation.
- `src/screens/` contains auth, dashboard, documents, checklist, profile, and media log screens.
- `src/navigation/` contains the auth and main app navigators.
- `src/services/` contains Firebase auth, Firestore, storage, and checklist sync helpers.
- `src/context/` contains shared app state such as auth and theme.
- `src/utils/mockData.js` provides mock data shaped to match Firestore documents.

## Scripts

The current `package.json` defines these npm scripts:

- `npm start` runs `expo start`
- `npm run android` runs `expo start --android`
- `npm run ios` runs `expo start --ios`
- `npm run web` runs `expo start --web`
- `npm run convert:osha` runs `node scripts/convertOshaChecklists.js`
- `npm run lint` runs ESLint with `eslint-config-expo`
- `npm run format` runs Prettier across the repo
- `npm test` runs a minimal Jest smoke test with `jest-expo`

## Firebase

Firebase config is loaded from environment variables. Copy `.env.example` to `.env`, add Firebase project credentials, and review:

- `FIREBASE_SETUP.md`
- `firestore.rules`
- `storage.rules`

When Firebase config is missing in development, the app is designed to fall back to mock behavior for parts of the UI while warning that real Firebase features are unavailable.

## Running Locally

1. Install dependencies with `npm install`.
2. Create `.env` from `.env.example` and add Firebase values.
3. Start Expo with `npm start`, or use `npm run android`, `npm run ios`, or `npm run web`.
