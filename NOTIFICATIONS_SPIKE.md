# Expo Push Notifications + FCM Spike

**Status:** Spike / Research  
**Do not merge** unless product roadmap includes push notifications in MVP.  
**Created:** 2026-04-14  
**Purpose:** Feasibility study and reference implementation for Expo push notifications + Firebase Cloud Messaging (FCM).

---

## Overview

This spike documents the steps to integrate Expo push notifications with Firebase Cloud Messaging (FCM) for Android/iOS delivery. Includes:

- Client-side token registration and storage
- Firestore user document structure for tokens
- Cloud Function stub for sending notifications
- Security considerations
- Testing strategy

**Scope:** Reference implementation only. Not production-ready without additional error handling, analytics, and compliance review.

---

## 1. Client-side setup

### 1.1 Install dependencies

```bash
npm install expo-notifications expo-device expo-constants
```

### 1.2 Request permissions (iOS + Android)

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const requestPushPermissions = async () => {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return null;
  }

  return finalStatus;
};
```

### 1.3 Get and register Expo push token

```javascript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getFirebaseAuth } from './firebase';
import { db } from './firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Get Expo push token for current device
 * ⚠️  SECURITY NOTE:
 * - Push tokens are device-specific; do NOT log in production.
 * - Store tokens in Firestore under user document only.
 * - Tokens expire periodically; refresh every app session.
 */
export const getExpoPushToken = async () => {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('EAS project ID not found in app.json');
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    return token;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

/**
 * Store push token in Firestore user document
 * Overwrites previous token on each refresh
 */
export const registerPushToken = async (userId) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const token = await getExpoPushToken();
  if (!token) {
    return { error: new Error('Failed to get push token') };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      'pushTokens.expo': token,
      'pushTokens.lastRefreshed': Timestamp.now(),
      'pushTokens.deviceId': Device.deviceId || 'unknown',
    }, { merge: true });

    return { data: token };
  } catch (error) {
    console.error('Error storing push token in Firestore:', error);
    return { error };
  }
};

/**
 * One-time setup: request permissions, get token, store in Firestore
 * Call this once after login/signup
 */
export const initializePushNotifications = async (userId) => {
  const permStatus = await requestPushPermissions();
  if (permStatus !== 'granted') {
    return { error: new Error('Permission denied') };
  }

  return registerPushToken(userId);
};
```

### 1.4 Set up notification handler (optional display logic)

```javascript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Return true to show badge, false to dismiss, async to custom logic
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Listen for incoming notifications
 * Call once in app startup (e.g. useEffect in AppNavigator)
 */
export const subscribeToNotifications = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { notification } = response;
      console.log('Notification received:', notification.request.content);
      // Handle deep linking or custom actions here
    }
  );

  return () => subscription.remove();
};
```

---

## 2. Firestore schema

### 2.1 User document structure

```javascript
{
  uid: "user123",
  email: "owner@example.com",
  // ... other user fields ...

  // Push token storage
  pushTokens: {
    expo: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]",
    fcm: "eJztVsFuwjAM/ZWVY1IJXFSCBDQ0aZuAK5xqUhI2NSMhOVGhTf9+JhPdsFg7cLHi2H7O",
    lastRefreshed: Timestamp(2026-04-14T12:34:56Z),
    deviceId: "device-123-abc",
  },

  // Notification preferences
  notificationPreferences: {
    enabled: true,
    dueTodayNotifications: true,
    overdueNotifications: true,
    expiringDocumentNotifications: true,
    inAppRemindersOnly: false, // If true, skip push, only show in-app
  },
}
```

### 2.2 Firestore rules (add to firestore.rules)

```
match /users/{userId} {
  // Allow user to read/write their own document fields including pushTokens and notificationPreferences
  allow read, write: if request.auth.uid == userId;
}
```

---

## 3. Cloud Function stub

### 3.1 Send notification via Cloud Task (pseudo-code)

**File:** `functions/src/notifications.ts` (or .js)

⚠️  **This is a stub.** Real implementation requires:
- Input validation (token format, user exists)
- Retry logic
- Error tracking (Sentry/Crashlytics)
- Batch operations for multiple users
- PII redaction in notification content

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * HTTP-triggered function to send a push notification
 * 
 * ⚠️  SECURITY & PII:
 * - Validate caller (service account, authenticated user, or API key).
 * - Do NOT include PII (user name, business name, document numbers) in notification title/body.
 * - Use generic messages: "You have 1 overdue item" instead of "Permit #ABC123 is overdue".
 * - Consider: can user opt out via preferences?
 * - All tokens are device-specific; tokens are NOT PII themselves but should be treated as sensitive.
 */

interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>; // Custom payload for deep linking
}

export const sendPushNotification = functions.https.onRequest(async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!bearerToken) {
    return res.status(401).json({ error: 'Missing Authorization bearer token' });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(bearerToken);
  } catch {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  const { userId, title, body, data } = req.body as SendNotificationRequest;

  // Validate input
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
  }
  if (decodedToken.uid !== userId && !decodedToken.admin) {
    return res.status(403).json({ error: 'Not authorized to send notifications to this user' });
  }

  try {
    // 1. Fetch user document with push token
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const expoToken = userData?.pushTokens?.expo;
    const notificationPreferences = userData?.notificationPreferences || {};

    // 2. Check if notifications are enabled
    if (!notificationPreferences.enabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return res.status(200).json({ skipped: true, reason: 'User disabled notifications' });
    }

    // 3. If no token, skip (user hasn't enabled push or revoked)
    if (!expoToken) {
      console.log(`No push token for user ${userId}`);
      return res.status(200).json({ skipped: true, reason: 'No push token found' });
    }

    // 4. Call Expo push API
    const expoResponse = await sendExpoNotification(expoToken, title, body, data);

    if (!expoResponse.ok) {
      console.error('Expo push failed for token [REDACTED]:', expoResponse);
      // Log error; optionally mark token as invalid if error is "InvalidCredentials"
      return res.status(500).json({ error: 'Push send failed', details: expoResponse });
    }

    return res.status(200).json({ success: true, ticketId: expoResponse.ticketId });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Call Expo push service (stub; use expo-server-sdk in production)
 */
async function sendExpoNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // In production, use: npm install expo-server-sdk
  // import { Expo } from 'expo-server-sdk';
  // const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

  // For this spike, simulate the API call:
  const payload = {
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  // TODO: Replace with actual expo-server-sdk call
  // const messages = expo.chunkPushNotifications([payload]);
  // const response = await expo.sendPushNotificationsAsync(messages);

  console.log('(SPIKE STUB) Would send Expo push:', payload);

  return {
    ok: true,
    ticketId: 'ticket-' + Date.now(), // Mock
  };
}

/**
 * Scheduled function to check for due items and send reminders
 * (Example: runs daily at 8am)
 */
export const dailyReminderCheck = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // 1. Query all users with due items
      // 2. For each, build notification
      // 3. Call sendPushNotification

      console.log('Daily reminder check completed at', new Date().toISOString());
      return null;
    } catch (error) {
      console.error('Error in daily reminder check:', error);
      return null;
    }
  });
```

### 3.2 Deploy function

```bash
cd functions
npm install firebase-functions firebase-admin expo-server-sdk
firebase deploy --only functions:sendPushNotification
```

---

## 4. App initialization

### 4.1 Call push setup in AuthContext or after login

```javascript
// In AuthContext or LoginScreen after successful sign-in:

useEffect(() => {
  if (user?.uid) {
    initializePushNotifications(user.uid).catch((err) => {
      console.warn('Push notification setup failed (non-blocking):', err);
      // Do not break login flow
    });

    // Subscribe to notification responses
    const unsubscribe = subscribeToNotifications();
    return unsubscribe;
  }
}, [user?.uid]);
```

---

## 5. Testing strategy

### 5.1 Manual testing (simulator limitations)

**Note:** Android/iOS simulators do NOT receive real push notifications.

**On physical device:**

```bash
# 1. Build and run app on device
eas build --platform ios --profile preview
# or android equivalent

# 2. Open app, complete login
# 3. Check Firestore: users/{userId}/pushTokens.expo should be populated

# 4. Call Cloud Function to send test notification
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendPushNotification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "title": "Test Notification",
    "body": "This is a test push notification"
  }'

# 5. Device should receive notification (if app is background or foreground)
```

### 5.2 Expo Notifications Tool (optional)

```bash
npm install -g expo-notifications-cli

# Send test notification to token
expo-notifications send --token ExponentPushToken[...] --title "Test" --body "Test"
```

---

## 6. Security & PII considerations

### 6.1 What NOT to include in notifications

❌ User name, business name, business address  
❌ Specific document numbers or types  
❌ Customer/item details  
❌ Internal user IDs or internal system paths  

### 6.2 What IS safe to include

✅ "You have 1 overdue item"  
✅ "A document expires in 7 days"  
✅ "Complete your checklist"  
✅ Deep link parameters (user-initiated action only)

### 6.3 Token lifecycle

- Tokens expire after ~30 days.
- Refresh tokens at app launch or periodically.
- If push fails with "InvalidCredentials," mark token as revoked.
- Do NOT persist old tokens; overwrite on refresh.

### 6.4 Compliance

- **GDPR / CCPA:** Require explicit opt-in; provide opt-out mechanism in settings.
- **HIPAA (if applicable):** Push notifications may expose health data; review before using.
- **Apple/Google policies:** Follow guidelines for notification content and frequency.

---

## 7. Known limitations & next steps

### 7.1 Limitations of this spike

- ❌ No retry logic (failed sends are lost)
- ❌ No error tracking (use Sentry/Crashlytics in production)
- ❌ No batch sending (scales poorly to 1000s of users)
- ❌ No analytics (cannot measure delivery/open rates)
- ❌ No template system (all messages hardcoded)
- ❌ No scheduling (all sends are immediate)
- ❌ Cloud Function is HTTP-triggered (should be internal Pub/Sub for security)

### 7.2 Production checklist

Before merging to production:

- [ ] Implement expo-server-sdk properly
- [ ] Add comprehensive error handling + logging
- [ ] Use Cloud Task Queue for async, retryable sends
- [ ] Add user notification preferences UI
- [ ] Rate-limit notifications per user
- [ ] Add analytics tracking (delivery, opens, dismissals)
- [ ] Write Cloud Function tests
- [ ] Security audit of Firestore rules
- [ ] Compliance review (GDPR, CCPA, platform-specific)
- [ ] Documentation for on-call team

### 7.3 Optional enhancements

- SMS fallback (Twilio) for critical alerts
- Email digests (SendGrid) for non-urgent items
- Deep link configuration for notification tap
- Notification templates and variables
- A/B testing notification copy
- Geofencing (if location relevant for food truck)

---

## 8. References

- **Expo Notifications:** https://docs.expo.dev/push-notifications/overview/
- **Firebase Cloud Functions:** https://firebase.google.com/docs/functions
- **expo-server-sdk:** https://github.com/expo/expo-server-sdk-node
- **Google FCM:** https://firebase.google.com/docs/cloud-messaging
- **Apple APNS:** https://developer.apple.com/documentation/usernotifications

---

## 9. Conclusion

This spike provides a working reference for Expo push notifications + FCM integration. **Do not use in production without:**

1. Additional error handling and logging
2. Token lifecycle management
3. User preference enforcement
4. Compliance review
5. Analytics tracking
6. Rate limiting and scheduling

**Recommend:** Merge to a `spike/notifications` branch or feature branch. Re-evaluate after in-app reminders (NOTIF-01) are validated with users.
