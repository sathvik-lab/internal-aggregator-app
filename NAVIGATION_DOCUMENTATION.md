# Navigation Documentation

## Overview

This document describes the navigation structure and flow for the Food Truck Compliance app (Expo + React Navigation). Route name constants live in **`src/navigation/navigationConfig.js`**.

---

## Navigation tree (current)

```
AppNavigator (Root — NavigationContainer + linking config)
│
├── AuthNavigator — when user is NOT signed in
│   ├── Login (initial route)
│   ├── Signup
│   └── ForgotPassword
│
├── OnboardingNavigator — when signed in AND needsOwnerOnboarding === true
│   └── OwnerOnboarding (initial route)  →  OwnerOnboardingScreen
│
└── MainNavigator — when signed in AND onboarding complete
    └── Bottom tabs (order in MainNavigator.js):
        ├── Dashboard          → DashboardScreen
        ├── Documents          → DocumentsStack
        │   ├── DocumentsList (initial)
        │   └── DocumentDetail
        ├── Checklist          → ChecklistScreen
        ├── Profile            → ProfileStack
        │   ├── ProfileMain (initial)  → ProfileScreen
        │   └── Staff          → StaffScreen (placeholder “coming soon”)
        ├── MediaLogs          → MediaLogScreen
        └── InspectionReadiness → InspectionReadinessScreen
```

**Files:** `AppNavigator.js`, `AuthNavigator.js`, `OnboardingNavigator.js`, `MainNavigator.js`, `navigationConfig.js`.

**Guard (high level):** `src/context/AuthContext.js` exposes `needsOwnerOnboarding`; `AppNavigator.js` chooses Auth vs Onboarding vs Main. See **`shouldShowOwnerOnboarding`** in `src/services/userProfile.js`.

---

## Route names (`ROUTES`)

Defined in `navigationConfig.js` (use these instead of string literals):

```javascript
ROUTES = {
  AUTH: {
    LOGIN: 'Login',
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
  },
  DOCUMENTS: {
    LIST: 'DocumentsList',
    DETAIL: 'DocumentDetail',
  },
  PROFILE: {
    MAIN: 'ProfileMain',
    STAFF: 'Staff',
  },
  FUTURE: {
    REPORTS: 'Reports',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
  },
};
```

**Note:** `ProfileStack` registers the staff screen with the name **`Staff`** (same string as `ROUTES.PROFILE.STAFF`). Prefer `ROUTES.PROFILE.STAFF` when navigating from profile.

---

## Navigation features

### 1. Authentication and onboarding

- Unauthenticated users only see **`AuthNavigator`**.
- Authenticated users with an incomplete owner business profile see **`OnboardingNavigator`** until requirements in `userProfile.js` are met.
- Otherwise **`MainNavigator`** (tabs) is shown.
- Log out from profile returns the tree to **`AuthNavigator`** (no back stack into main app).

### 2. Android back button

- `BackHandler` in `AppNavigator.js` reduces the chance of returning to authenticated screens immediately after logout.

### 3. Gestures

- Stack screen options in `MainNavigator.js` set **`gestureEnabled: false`** on document stack screens to avoid Android casting issues documented in code comments.
- Auth and onboarding stacks also disable gestures in their navigators.

### 4. Deep linking

`DEEP_LINKING_CONFIG` in `navigationConfig.js` defines paths such as:

| Path (prefix `foodtruckcompliance://` or configured https host) | Screen |
|------------------------------------------------------------------|--------|
| `login` | Login |
| `signup` | Signup |
| `forgot-password` | ForgotPassword |
| `onboarding` | Owner onboarding |
| `dashboard` | Dashboard |
| `documents/list`, `documents/detail/:documentId` | Documents stack |
| `checklist` | Checklist |
| `profile`, `profile/staff` | Profile stack |
| `logs` | Media logs |
| `readiness` | Inspection readiness |

Full product handling of incoming links may still need `app.config.js` scheme setup and testing; config is prepared in code.

---

## Common patterns

### Tabs

```javascript
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/navigationConfig';

navigation.navigate(ROUTES.MAIN.DOCUMENTS);
navigation.navigate(ROUTES.MAIN.INSPECTION_READINESS);
```

### Documents stack

```javascript
navigation.navigate(ROUTES.DOCUMENTS.DETAIL, { documentId: document.id });
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

- [ ] Login → Signup → back to Login  
- [ ] Login → Forgot Password → back to Login  
- [ ] Sign up → Owner onboarding (if profile incomplete) → main tabs  
- [ ] Login → Dashboard (onboarding already complete)  
- [ ] All tabs: Dashboard, Documents, Checklist, Profile, Logs, Readiness  
- [ ] Documents list → detail → back  
- [ ] Profile → Team / Staff → back  
- [ ] Profile → Logout → cannot navigate back to main app  
- [ ] Android back after logout  
- [ ] Tab state preserved when switching tabs  

---

## Files reference

| File | Role |
|------|------|
| `src/navigation/AppNavigator.js` | Root container, auth/onboarding/main switch |
| `src/navigation/AuthNavigator.js` | Login, Signup, Forgot password |
| `src/navigation/OnboardingNavigator.js` | Owner onboarding stack |
| `src/navigation/MainNavigator.js` | Tabs + Documents stack + Profile stack |
| `src/navigation/navigationConfig.js` | `ROUTES`, linking, helpers |
| `src/context/AuthContext.js` | Auth + profile loading + `needsOwnerOnboarding` |

---

## Related docs

- [`docs/PRD_TRACEABILITY.md`](docs/PRD_TRACEABILITY.md) — PRD §6 mapped to files and status.  
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Firebase-first architecture overview.
