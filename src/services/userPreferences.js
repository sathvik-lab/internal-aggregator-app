/**
 * User Preferences Service
 *
 * Manages user notification and reminder preferences in Firestore.
 * Preferences are stored in users/{userId}/preferences subdoc.
 *
 * Structure designed for Cloud Functions to read and trigger reminders.
 */

import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

const PREFERENCES_DEFAULTS = {
  // Reminder toggles (in-app banners + future push/email)
  reminders: {
    dueTodayEnabled: true,
    overdueEnabled: true,
    expiringDocumentsEnabled: true,
    newMediaLogsEnabled: false, // Notification for new activity
  },

  notificationPreferences: {
    enabled: false,
    dueTodayNotifications: true,
    overdueNotifications: true,
    expiringDocumentNotifications: true,
    inAppRemindersOnly: false,
  },

  // When reminders last checked / dismissed (for smart notification frequency)
  lastDismissed: {
    dueToday: null, // ISO string
    overdue: null,
    expiringDocuments: null,
    documentExpiry: null,
  },

  // Frequency preferences (for future Cloud Functions scheduling)
  reminderFrequency: {
    dailyDigestTime: '09:00', // 24-hour format; user's local time (implied)
    includeWeekly: true, // For future: once-a-week digest
  },

  // Cloud Functions metadata (read-only from client)
  _metadata: {
    createdAt: null, // Timestamp
    updatedAt: null, // Timestamp
    version: 1, // Schema version for migrations
  },
};

/**
 * Initialize or fetch user preferences
 * @param {string} userId - Firebase UID
 * @returns {Promise<Object>} Preference object
 */
export const initializeUserPreferences = async (userId) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    const snap = await getDoc(prefsRef);

    if (snap.exists()) {
      return { data: snap.data() };
    }

    // First time: create defaults
    const newPrefs = {
      ...PREFERENCES_DEFAULTS,
      _metadata: {
        ...PREFERENCES_DEFAULTS._metadata,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    };

    await setDoc(prefsRef, newPrefs);
    return { data: newPrefs };
  } catch (error) {
    console.error('Error initializing user preferences:', error);
    return { error };
  }
};

/**
 * Fetch current user preferences
 * @param {string} userId - Firebase UID
 * @returns {Promise<Object>} { data, error }
 */
export const fetchUserPreferences = async (userId) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    const snap = await getDoc(prefsRef);

    if (!snap.exists()) {
      // Auto-init if missing
      return initializeUserPreferences(userId);
    }

    return { data: snap.data() };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { error };
  }
};

/**
 * Subscribe to real-time preference updates
 * @param {string} userId - Firebase UID
 * @param {Function} onData - Callback when data changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserPreferences = (userId, onData) => {
  if (!userId) {
    console.error('userId required for subscription');
    return () => {};
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  const unsubscribe = onSnapshot(
    prefsRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    },
    (error) => {
      console.error('Error in preferences subscription:', error);
    }
  );

  return unsubscribe;
};

/**
 * Update a reminder setting
 * @param {string} userId - Firebase UID
 * @param {string} reminderKey - e.g. 'dueTodayEnabled'
 * @param {boolean} value - true/false
 * @returns {Promise<Object>} { error } on fail
 */
export const updateReminderSetting = async (userId, reminderKey, value) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    await updateDoc(prefsRef, {
      [`reminders.${reminderKey}`]: value,
      '_metadata.updatedAt': Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating reminder setting:', error);
    return { error };
  }
};

/**
 * Dismiss a reminder type (set lastDismissed timestamp)
 * @param {string} userId - Firebase UID
 * @param {string} reminderType - 'dueToday' | 'overdue' | 'expiringDocuments' | 'documentExpiry'
 * @returns {Promise<Object>} { error } on fail
 */
export const dismissReminder = async (userId, reminderType) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    await updateDoc(prefsRef, {
      [`lastDismissed.${reminderType}`]: new Date().toISOString(),
      '_metadata.updatedAt': Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    return { error };
  }
};

/**
 * Update daily digest time preference
 * @param {string} userId - Firebase UID
 * @param {string} time - 24-hour time (e.g. '09:00')
 * @returns {Promise<Object>} { error } on fail
 */
export const updateDailyDigestTime = async (userId, time) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    await updateDoc(prefsRef, {
      'reminderFrequency.dailyDigestTime': time,
      '_metadata.updatedAt': Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating digest time:', error);
    return { error };
  }
};

export const updateNotificationPreference = async (userId, key, value) => {
  if (!userId) {
    return { error: new Error('userId required') };
  }

  const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');

  try {
    await updateDoc(prefsRef, {
      [`notificationPreferences.${key}`]: value,
      '_metadata.updatedAt': Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating notification preference:', error);
    return { error };
  }
};

export default {
  initializeUserPreferences,
  fetchUserPreferences,
  subscribeToUserPreferences,
  updateReminderSetting,
  dismissReminder,
  updateDailyDigestTime,
  updateNotificationPreference,
  PREFERENCES_DEFAULTS,
};
