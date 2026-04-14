import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchUserPreferences, updateNotificationPreference } from './userPreferences';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getProjectId = () => (
  Constants.expoConfig?.extra?.eas?.projectId
  || Constants.easConfig?.projectId
  || null
);

export const requestPushPermissions = async () => {
  if (!Device.isDevice) {
    return { granted: false, error: new Error('Push notifications require a physical device.') };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return { granted: status === 'granted', status };
};

export const getPushTokens = async () => {
  const projectId = getProjectId();
  if (!projectId) {
    return {
      expoToken: null,
      fcmToken: null,
      error: new Error('Missing EAS project ID for push token registration.'),
    };
  }

  try {
    const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data || null;
    const nativeTokenResult = await Notifications.getDevicePushTokenAsync();
    const nativeToken = typeof nativeTokenResult?.data === 'string' ? nativeTokenResult.data : null;

    return {
      expoToken,
      fcmToken: Platform.OS === 'android' ? nativeToken : null,
      apnsToken: Platform.OS === 'ios' ? nativeToken : null,
      error: null,
    };
  } catch (error) {
    return { expoToken: null, fcmToken: null, apnsToken: null, error };
  }
};

export const registerPushTokens = async (userId) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const permissionResult = await requestPushPermissions();
  if (!permissionResult.granted) {
    return { error: new Error('Notification permission not granted.') };
  }

  const tokenResult = await getPushTokens();
  if (tokenResult.error || !tokenResult.expoToken) {
    return { error: tokenResult.error || new Error('Unable to get Expo push token.') };
  }

  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        pushTokens: {
          expo: tokenResult.expoToken,
          fcm: tokenResult.fcmToken || null,
          apns: tokenResult.apnsToken || null,
          platform: Platform.OS,
          lastRefreshed: Timestamp.now(),
        },
      },
      { merge: true },
    );

    return {
      data: {
        expoToken: tokenResult.expoToken,
        fcmToken: tokenResult.fcmToken || null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const unregisterPushTokens = async (userId) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }
  try {
    await updateDoc(doc(db, 'users', userId), {
      pushTokens: {
        expo: null,
        fcm: null,
        apns: null,
        platform: Platform.OS,
        lastRefreshed: Timestamp.now(),
      },
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

export const initializePushNotificationsIfEnabled = async (userId) => {
  if (!userId) {
    return { data: null, error: new Error('userId required') };
  }

  const prefsResult = await fetchUserPreferences(userId);
  if (prefsResult.error) {
    return { data: null, error: prefsResult.error };
  }

  const enabled = Boolean(prefsResult.data?.notificationPreferences?.enabled);
  const inAppOnly = Boolean(prefsResult.data?.notificationPreferences?.inAppRemindersOnly);
  if (!enabled || inAppOnly) {
    return { data: null, error: null, skipped: true };
  }

  return registerPushTokens(userId);
};

export const setPushNotificationsEnabled = async (userId, enabled) => {
  const prefResult = await updateNotificationPreference(userId, 'enabled', Boolean(enabled));
  if (prefResult.error) {
    return { error: prefResult.error };
  }

  if (!enabled) {
    await unregisterPushTokens(userId);
    return { success: true, enabled: false };
  }

  const registerResult = await registerPushTokens(userId);
  if (registerResult.error) {
    return { error: registerResult.error };
  }

  return { success: true, enabled: true, data: registerResult.data };
};

export default {
  requestPushPermissions,
  getPushTokens,
  registerPushTokens,
  unregisterPushTokens,
  initializePushNotificationsIfEnabled,
  setPushNotificationsEnabled,
};
