# Navigation Documentation

## Overview

Navigation structure and flow for the Food Truck Compliance app (Expo + React Navigation). Route name constants, deep linking, and helpers live in **`src/navigation/navigationConfig.js`**.

---

## Navigation tree (current)

```
AppNavigator (Root — NavigationContainer + createAppLinking(user, needsOwnerOnboarding))
│
├── AuthNavigator — when user is NOT signed in
│   ├── Login (initial route)          → LoginScreen
│   ├── PhoneLogin                     → PhoneLoginScreen
│   ├── Signup                         → SignupScreen
│   └── ForgotPassword                 → ForgotPasswordScreen
│
├── OnboardingNavigator — when signed in AND needsOwnerOnboarding === true
│   └── OwnerOnboarding (initial route) → OwnerOnboardingScreen
│
└── MainNavigator — when signed in AND onboarding complete
    └── Bottom tabs (declaration order in MainNavigator.js; tab bar shows first six only)
        ├── Dashboard                    → DashboardScreen
        ├── Documents                    → DocumentsStack
        │   ├── DocumentsList (initial)
        │   └── DocumentDetail
        ├── Checklist                    → ChecklistScreen
        ├── Profile                      → ProfileStack
        │   ├── ProfileMain (initial)    → ProfileScreen
        │   └── Staff (owner only)       → StaffScreen — registered only if useEffectiveRole().isOwner
        ├── MediaLogs                    → MediaLogScreen
        ├── InspectionReadiness         → InspectionReadinessScreen
        ├── Incidents                    → IncidentsStack   [tabBarButton: () => null — hidden from tab bar]
        │   ├── IncidentsList (initial)
        │   └── IncidentDetail
        └── Maintenance                  → MaintenanceStack [tabBarButton: () => null — hidden from tab bar]
            ├── MaintenanceList (initial)
            └── MaintenanceDetail
```

**Files:** `src/navigation/AppNavigator.js`, `src/navigation/AuthNavigator.js`, `src/navigation/OnboardingNavigator.js`, `src/navigation/MainNavigator.js`, `src/navigation/navigationConfig.js`.

**Guard (high level):** `src/context/AuthContext.js` exposes `needsOwnerOnboarding`; `AppNavigator.js` chooses Auth vs Onboarding vs Main. See **`shouldShowOwnerOnboarding`** in `src/services/userProfile.js`.

**Hidden tabs:** `Incidents` and `Maintenance` are real `Tab.Screen` routes (stack roots, deep links, `navigation.navigate`) but **`options.tabBarButton: () => null`** hides them from the bottom bar. Entry from **`DashboardScreen`** and **`InspectionReadinessScreen`** (and list → detail inside each stack) via `navigation.navigate(ROUTES.MAIN.INCIDENTS)` / `ROUTES.MAIN.MAINTENANCE`.

---

## Route names (`ROUTES`)

Defined in `navigationConfig.js` (use these instead of string literals):

```javascript
ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    PHONE_LOGIN: 'PhoneLogin',
    SIGNUP: 'Signup',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  ONBOARDING: {
    OWNER_PROFILE: 'OwnerOnboarding',
  },
  MAIN: {
    DASHBOARD: 'Dashboard',
    DOCUMENTS: 'Documents',
    CHECKLIST: 'Checklist',
    PROFILE: 'Profile',
    MEDIA_LOGS: 'MediaLogs',
    INSPECTION_READINESS: 'InspectionReadiness',
    INCIDENTS: 'Incidents',
    MAINTENANCE: 'Maintenance',
  },
  DOCUMENTS: {
    LIST: 'DocumentsList',
    DETAIL: 'DocumentDetail',
  },
  PROFILE: {
    MAIN: 'ProfileMain',
    STAFF: 'Staff',
  },
  INCIDENTS: {
    LIST: 'IncidentsList',
    DETAIL: 'IncidentDetail',
  },
  MAINTENANCE: {
    LIST: 'MaintenanceList',
    DETAIL: 'MaintenanceDetail',
  },
  FUTURE: {
    REPORTS: 'Reports',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
  },
};
```

**Note:** `ProfileStack` registers **`Staff`** only for owners. Prefer `ROUTES.PROFILE.STAFF` when navigating from profile.

---

## Navigation features

### 1. Authentication and onboarding

- Unauthenticated users only see **`AuthNavigator`** (Login initial; can open **PhoneLogin**, Signup, ForgotPassword).
- Authenticated users with an incomplete owner business profile see **`OnboardingNavigator`** until requirements in `userProfile.js` are met.
- Otherwise **`MainNavigator`** (tabs) is shown.
- Log out from profile returns the tree to **`AuthNavigator`** (no back stack into main app).

### 2. Android back button

- `BackHandler` in `AppNavigator.js` reduces the chance of returning to authenticated screens immediately after logout.

### 3. Gestures

- Stack screen options in `MainNavigator.js` set **`gestureEnabled: false`** on inner stacks (documents, profile, incidents, maintenance) to avoid Android casting issues documented in code comments.
- Auth and onboarding stacks disable gestures in their navigators.

### 4. Deep linking

`DEEP_LINKING_CONFIG` in `navigationConfig.js` defines path → screen mapping. **`createAppLinking({ user, needsOwnerOnboarding })`** (used from `AppNavigator.js`) adds:

- Prefixes: **`foodtruckcompliance://`**, **`https://foodtruckcompliance.app`**, **`https://www.foodtruckcompliance.app`**
- **Unknown paths** → `dashboard` when signed in and onboarding complete; **`onboarding`** when signed in but profile incomplete; **`login`** when signed out
- **Stub routes** (`reports`, `settings`, `notifications`) listed in config but not mounted → same fallback as unknown

Path segments below are relative to a prefix (custom scheme or https host).

| Path | Maps to |
|------|---------|
| `login` | Auth → Login |
| `phone-login` | Auth → PhoneLogin |
| `signup` | Auth → Signup |
| `forgot-password` | Auth → ForgotPassword |
| `onboarding` | Onboarding → OwnerOnboarding |
| `dashboard` | Main tab → Dashboard |
| `documents/list` | Main tab Documents → DocumentsList |
| `documents/detail/:documentId` | Documents → DocumentDetail |
| `checklist` | Main tab → Checklist |
| `profile` | Main tab Profile → ProfileMain |
| `profile/staff` | Profile → Staff |
| `logs` | Main tab → MediaLogs |
| `readiness` | Main tab → InspectionReadiness |
| `incidents` | Main tab Incidents (hidden) → IncidentsList |
| `incidents/:incidentId` | Incidents → IncidentDetail |
| `maintenance` | Main tab Maintenance (hidden) → MaintenanceList |
| `maintenance/:taskId` | Maintenance → MaintenanceDetail |
| `reports` | Listed in config only — no matching navigator screen yet |
| `settings` | Listed in config only — no matching navigator screen yet |
| `notifications` | Listed in config only — no matching navigator screen yet |

**Native config:** `app.config.js` sets `scheme: 'foodtruckcompliance'`, iOS **`associatedDomains`** (`applinks:` apex + `www`), and Android **https** intent filters for both hosts. Universal links require hosting **AASA** (iOS) and **Digital Asset Links** (Android) on the real domain.

---

## Deep link test commands (CLI)

Use a **booted simulator / device** with the app installed (dev client or release). Replace bundle id / package if you change them.

### Custom scheme (`foodtruckcompliance://`)

**iOS Simulator**

```bash
xcrun simctl openurl booted "foodtruckcompliance://readiness"
xcrun simctl openurl booted "foodtruckcompliance://phone-login"
xcrun simctl openurl booted "foodtruckcompliance://documents/detail/YOUR_DOCUMENT_ID"
```

**Android (package `com.internalaggregator.app`)**

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "foodtruckcompliance://readiness" com.internalaggregator.app

adb shell am start -W -a android.intent.action.VIEW \
  -d "foodtruckcompliance://phone-login" com.internalaggregator.app

adb shell am start -W -a android.intent.action.VIEW \
  -d "foodtruckcompliance://documents/detail/YOUR_DOCUMENT_ID" com.internalaggregator.app
```

### HTTPS universal links (after AASA + assetlinks live)

```bash
xcrun simctl openurl booted "https://foodtruckcompliance.app/readiness"
```

### Expected behavior (sanity)

| URL (examples) | Signed out | Signed in + onboarding done |
|----------------|------------|----------------------------|
| `…://readiness` | Opens **Login** (then sign in) | **InspectionReadiness** tab |
| `…://phone-login` | **PhoneLogin** | Prefer testing signed-out; signed-in + main app uses different root navigator |
| `…://documents/detail/{id}` | **Login** | Documents stack → **DocumentDetail** with `documentId` |
| `…://reports` (stub) | **Login** | **Dashboard** (fallback) |

Run Jest path checks: `npm test -- --testPathPattern=deep-linking`

---

## Common patterns

### Tabs (visible)

```javascript
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/navigationConfig';

navigation.navigate(ROUTES.MAIN.DASHBOARD);
navigation.navigate(ROUTES.MAIN.DOCUMENTS);
navigation.navigate(ROUTES.MAIN.CHECKLIST);
navigation.navigate(ROUTES.MAIN.PROFILE);
navigation.navigate(ROUTES.MAIN.MEDIA_LOGS);
navigation.navigate(ROUTES.MAIN.INSPECTION_READINESS);
```

### Hidden tab roots (stacks)

```javascript
navigation.navigate(ROUTES.MAIN.INCIDENTS, {
  screen: ROUTES.INCIDENTS.LIST,
});
navigation.navigate(ROUTES.MAIN.INCIDENTS, {
  screen: ROUTES.INCIDENTS.DETAIL,
  params: { incidentId: '...' },
});
navigation.navigate(ROUTES.MAIN.MAINTENANCE, {
  screen: ROUTES.MAINTENANCE.LIST,
});
navigation.navigate(ROUTES.MAIN.MAINTENANCE, {
  screen: ROUTES.MAINTENANCE.DETAIL,
  params: { taskId: '...' },
});
```

### Documents stack

```javascript
navigation.navigate(ROUTES.MAIN.DOCUMENTS, {
  screen: ROUTES.DOCUMENTS.DETAIL,
  params: { documentId: document.id },
});
```

### Params used for focus (examples)

- Checklist: `{ initialTab: 'today' }` (from readiness / dashboard flows).
- Documents: `{ highlightExpiring: true }`.
- Media logs: `{ initialRangeType: 'all' }`.

Exact param handling is implemented on the target screens.

### After logout

Use patterns from `NavigationHelpers` in `navigationConfig.js` if you need an explicit reset (e.g. `resetToRoute`).

---

## Manual testing checklist

- [ ] Login (initial) → Signup → back to Login  
- [ ] Login → **Phone Login** → complete or cancel flow → back to Login  
- [ ] Login → Forgot Password → back to Login  
- [ ] Sign up → Owner onboarding (if profile incomplete) → main tabs  
- [ ] Login → Dashboard (onboarding already complete)  
- [ ] **Visible** tabs in bar order: Dashboard, Documents, Checklist, Profile, Logs (MediaLogs), Readiness (InspectionReadiness) — **Incidents** and **Maintenance** must **not** appear as tab icons  
- [ ] **Incidents:** navigate from Dashboard (or entry you use) → list → detail → back → returns to prior context  
- [ ] **Maintenance:** same as incidents for maintenance list/detail  
- [ ] Documents list → detail → back  
- [ ] Profile → Team / Staff (owner only) → back; staff route absent or unreachable for non-owner if applicable  
- [ ] Profile → Logout → cannot navigate back to main app  
- [ ] Android back after logout  
- [ ] Tab state preserved when switching among **visible** tabs  
- [ ] (Optional) Deep links: `phone-login`, `incidents`, `incidents/<id>`, `maintenance`, `maintenance/<id>` with scheme / universal link setup  

---

## Files reference

| File | Role |
|------|------|
| `src/navigation/AppNavigator.js` | Root container, auth/onboarding/main switch, `linking`, screen analytics |
| `src/navigation/AuthNavigator.js` | Login, **PhoneLogin**, Signup, Forgot password |
| `src/navigation/OnboardingNavigator.js` | Owner onboarding stack |
| `src/navigation/MainNavigator.js` | Tabs (incl. hidden Incidents/Maintenance), Documents / Profile / Incidents / Maintenance stacks |
| `src/navigation/navigationConfig.js` | `ROUTES`, `DEEP_LINKING_CONFIG`, `createAppLinking`, `normalizeIncomingLinkPath`, guards, helpers |
| `src/context/AuthContext.js` | Auth + profile loading + `needsOwnerOnboarding` |

---

## Related docs

- [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md) — PRD §6 mapped to files and status.  
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Firebase-first architecture overview.
