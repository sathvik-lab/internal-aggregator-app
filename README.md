# internal-aggregator-app

Expo React Native app for mobile document management and daily compliance checklists, backed by Firebase Authentication, Firestore, and Storage.

## CI

GitHub Actions runs on pushes and pull requests to `main` / `master`: checkout, `npm ci` (with npm cache), `npm run lint -- --max-warnings 0`, and `npm test`. Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Optional status badge (replace `OWNER` / `REPO` with your GitHub org and repository name):

```markdown
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

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
- `npm test` runs Jest (`jest-expo`, `--runInBand`)

## Firebase

Firebase config is loaded from environment variables. Copy `.env.example` to `.env`, add Firebase project credentials, and review:

- `FIREBASE_SETUP.md`
- `firestore.rules`
- `storage.rules`

When Firebase config is missing in development, the app is designed to fall back to mock behavior for parts of the UI while warning that real Firebase features are unavailable.

## Offline and connectivity

The app is **online-first**: screens load data from Firestore (and related services) over the network. If the device is offline or Firestore returns `unavailable` / network-class errors, Dashboard, Checklist, Documents (and similar list screens) show a short explanation plus **Retry** or pull-to-refresh, not a claim that everything works offline.

**Persistence limits**

- **Web:** `src/services/firebase.js` enables Firestore IndexedDB persistence only on `web`, subject to browser support and single-tab constraints (see Firebase warnings in that file).
- **React Native (this repo):** Uses the modular Firebase **JS** SDK in Expo; **IndexedDB persistence is not used on iOS/Android**, so long-lived offline caches and automatic write queuing are **not** the same as in a native `@react-native-firebase/firestore` app. Treat RN as needing connectivity for reliable reads/writes unless you migrate the data layer.

Do not describe the product as offline-first; offline behavior is best-effort and environment-dependent.

## Running Locally

1. Install dependencies with `npm install`.
2. Create `.env` from `.env.example` and add Firebase values.
3. Start Expo with `npm start`, or use `npm run android`, `npm run ios`, or `npm run web`.

## Ship

EAS (Expo Application Services) builds use **`eas.json`** at the repo root. Profiles:

| Profile | Use |
|---------|-----|
| **`development`** | Dev client (`expo-dev-client`), internal distribution, **iOS simulator** builds, Android APK. |
| **`preview`** | Internal QA builds (Android APK, iOS device). |
| **`production`** | Store-ready (Android App Bundle, iOS device). `submit.production` is defined for store submission. |

Commands (after [EAS CLI](https://docs.expo.dev/build/setup/) login and `eas init` if the project is not linked yet):

```bash
eas build --profile development --platform ios
eas build --profile preview --platform all
eas build --profile production --platform all
eas submit --profile production --platform ios
```

### Firebase env on EAS (no keys in git)

`app.config.js` reads **`process.env.FIREBASE_*`** (and optional App Check keys) at **build time**; values must come from [EAS environment variables](https://docs.expo.dev/eas/environment-variables/) or your CI injectors—**never** commit real keys. Local dev keeps using **`.env`** (gitignored; see `.env.example`).

Create variables in the **Expo dashboard** (project → *Environment variables*) or with the EAS CLI (`eas env:create`, etc.—see Expo docs below). Use the **same names** as `.env.example` so EAS injects them into `process.env` during `eas build`:

| Variable | Required for real Firebase |
|----------|-----------------------------|
| `FIREBASE_API_KEY` | Yes |
| `FIREBASE_AUTH_DOMAIN` | Yes |
| `FIREBASE_PROJECT_ID` | Yes |
| `FIREBASE_STORAGE_BUCKET` | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Yes |
| `FIREBASE_APP_ID` | Yes |
| `FIREBASE_APPCHECK_SITE_KEY` | Optional (web App Check) |
| `FIREBASE_APPCHECK_USE_V3` | Optional (`true` / omit) |
| `FIREBASE_APPCHECK_DEBUG_TOKEN` | Optional (dev/debug only; avoid on production profile) |

Mark sensitive values as **Secret** visibility; scope each variable to the build profiles that need it (e.g. preview + production, or all).

### Expo docs (primary)

- [EAS Build configuration (`eas.json`)](https://docs.expo.dev/build/eas-json/)
- [Environment variables in EAS](https://docs.expo.dev/eas/environment-variables/)
- [Submit to app stores](https://docs.expo.dev/submit/introduction/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
