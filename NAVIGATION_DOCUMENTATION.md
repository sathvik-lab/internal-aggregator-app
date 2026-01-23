# Navigation Documentation

## Overview
This document describes the complete navigation structure, flow, and implementation details for the Internal Aggregator App.

## Navigation Architecture

### Navigation Tree

```
AppNavigator (Root - NavigationContainer)
│
├── AuthNavigator (when user is NOT authenticated)
│   ├── Login (initial route)
│   │   └── Can navigate to: Signup, ForgotPassword
│   │
│   ├── Signup
│   │   └── Can navigate to: Login (back)
│   │
│   └── ForgotPassword
│       └── Can navigate to: Login (back)
│
└── MainNavigator (when user IS authenticated)
    │
    ├── Dashboard (Tab)
    │   └── DashboardScreen
    │       └── Can navigate to: Documents, Checklist, Profile
    │
    ├── Documents (Tab)
    │   └── DocumentsStack
    │       ├── DocumentsList (initial route)
    │       │   └── Can navigate to: DocumentDetail
    │       │
    │       └── DocumentDetail
    │           └── Can navigate to: DocumentsList (back)
    │
    ├── Checklist (Tab)
    │   └── ChecklistScreen
    │
    └── Profile (Tab)
        └── ProfileScreen
            └── Can navigate to: Login (after logout)
```

## Route Names

All route names are centralized in `src/navigation/navigationConfig.js`:

```javascript
ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    SIGNUP: 'Signup',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    DASHBOARD: 'Dashboard',
    DOCUMENTS: 'Documents',
    CHECKLIST: 'Checklist',
    PROFILE: 'Profile',
  },
  DOCUMENTS: {
    LIST: 'DocumentsList',
    DETAIL: 'DocumentDetail',
  },
}
```

**Always use these constants instead of hardcoded strings to prevent typos and ensure consistency.**

## Navigation Features

### 1. Authentication State Management

- **AppNavigator** automatically switches between `AuthNavigator` and `MainNavigator` based on Firebase Auth state
- When user logs out, navigation automatically resets to `AuthNavigator`
- When user logs in, navigation automatically switches to `MainNavigator`

### 2. Navigation Guards

#### Android Back Button
- Prevents going back to authenticated screens after logout
- Implemented via `BackHandler` in `AppNavigator`

#### Route Protection
- Auth routes (Login, Signup, ForgotPassword) are only accessible when user is NOT authenticated
- Main routes (Dashboard, Documents, Checklist, Profile) are only accessible when user IS authenticated
- Navigation automatically handles this via `AppNavigator` state switching

### 3. Gesture Navigation

#### iOS Swipe Back
- Enabled on all stack navigators
- Can be disabled on initial routes (Login, DocumentsList)
- Smooth animations with 300ms duration

#### Configuration
```javascript
gestureEnabled: true,
gestureDirection: 'horizontal',
gestureResponseDistance: {
  horizontal: Platform.OS === 'ios' ? 20 : 0,
}
```

### 4. Back Button Handling

#### Stack Navigation
- Default back button appears automatically in stack navigators
- Styled with app theme colors
- Properly handles navigation history

#### Tab Navigation
- Tabs maintain their own navigation state
- Switching tabs preserves scroll position and state
- Back button in tab screens navigates within the tab's stack

### 5. Deep Linking (Future Implementation)

Deep linking structure is configured in `navigationConfig.js`:

```
internalaggregator://login
internalaggregator://signup
internalaggregator://forgot-password
internalaggregator://dashboard
internalaggregator://documents/list
internalaggregator://documents/detail/:documentId
internalaggregator://checklist
internalaggregator://profile
```

**Note:** Deep linking is configured but not yet fully implemented. To enable:
1. Configure URL scheme in `app.config.js`
2. Handle incoming links in `AppNavigator`
3. Test with `npx uri-scheme open internalaggregator://documents/list --ios`

## Navigation Patterns

### 1. Navigating Between Tabs

```javascript
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/navigationConfig';

const navigation = useNavigation();

// Navigate to another tab
navigation.navigate(ROUTES.MAIN.DOCUMENTS);
navigation.navigate(ROUTES.MAIN.CHECKLIST);
```

### 2. Navigating Within a Stack

```javascript
// Navigate to detail screen
navigation.navigate(ROUTES.DOCUMENTS.DETAIL, { 
  documentId: document.id 
});

// Go back
navigation.goBack();
```

### 3. Resetting Navigation (After Logout)

```javascript
import { NavigationHelpers } from '../navigation/navigationConfig';

// Reset to login screen (prevents going back)
NavigationHelpers.resetToRoute(navigation, ROUTES.AUTH.LOGIN);
```

### 4. Navigating from Dashboard

```javascript
// Navigate to Documents tab
navigation.navigate(ROUTES.MAIN.DOCUMENTS);

// Navigate to Checklist tab
navigation.navigate(ROUTES.MAIN.CHECKLIST);

// Navigate to Profile tab
navigation.navigate(ROUTES.MAIN.PROFILE);
```

## Common Navigation Issues & Solutions

### Issue 1: Can't navigate after logout
**Solution:** Navigation automatically resets when `user` state changes in `AppNavigator`. The `AuthContext` handles this.

### Issue 2: Back button goes to wrong screen
**Solution:** Use `navigation.reset()` or `NavigationHelpers.resetToRoute()` when you need to prevent back navigation.

### Issue 3: Tab state not preserved
**Solution:** This is expected behavior. Each tab maintains its own navigation state. Use state management (Context/Redux) if you need to share state between tabs.

### Issue 4: Gesture navigation not working
**Solution:** 
- Check that `gestureEnabled: true` is set in screen options
- Ensure you're not on the initial route (gesture is disabled on initial routes)
- Verify `gestureResponseDistance` is configured correctly

## Testing Navigation

### Manual Testing Checklist

- [ ] Login → Signup → Back to Login
- [ ] Login → Forgot Password → Back to Login
- [ ] Login → Dashboard (after successful login)
- [ ] Dashboard → Documents tab
- [ ] Documents → Document Detail → Back
- [ ] Dashboard → Checklist tab
- [ ] Dashboard → Profile tab
- [ ] Profile → Logout → Login (should not be able to go back)
- [ ] Android back button on Login (should exit app)
- [ ] Android back button after logout (should not go back to authenticated screens)
- [ ] iOS swipe back on stack screens
- [ ] Tab navigation preserves state

### Testing Deep Links (Future)

```bash
# iOS
npx uri-scheme open internalaggregator://documents/list --ios

# Android
adb shell am start -W -a android.intent.action.VIEW -d "internalaggregator://documents/list" com.internalaggregator.app
```

## Best Practices

1. **Always use ROUTES constants** instead of hardcoded strings
2. **Use navigation.navigate()** for forward navigation
3. **Use navigation.goBack()** for backward navigation
4. **Use NavigationHelpers.resetToRoute()** when you need to prevent back navigation
5. **Test on both iOS and Android** - gesture navigation differs
6. **Handle navigation errors** - wrap navigation calls in try-catch if needed
7. **Use proper TypeScript types** (if migrating to TypeScript) for navigation params

## Future Enhancements

1. **Deep Linking Implementation**
   - Handle incoming deep links
   - Navigate to specific screens from external links
   - Share links to documents/checklist items

2. **Navigation Analytics**
   - Track screen views
   - Monitor navigation patterns
   - Identify user flow issues

3. **Advanced Navigation Guards**
   - Role-based navigation (owner vs staff)
   - Feature flag-based navigation
   - Subscription-based navigation

4. **Navigation State Persistence**
   - Save navigation state on app close
   - Restore navigation state on app open
   - Handle deep links when app is closed

## Files Reference

- `src/navigation/AppNavigator.js` - Root navigator, handles auth state
- `src/navigation/AuthNavigator.js` - Auth stack (Login, Signup, ForgotPassword)
- `src/navigation/MainNavigator.js` - Main tabs (Dashboard, Documents, Checklist, Profile)
- `src/navigation/navigationConfig.js` - Route names, deep linking config, helpers
- `src/context/AuthContext.js` - Auth state management
