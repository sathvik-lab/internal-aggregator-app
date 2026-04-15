import Constants from 'expo-constants';

/** Expo Go — no native RNFirebase Analytics; avoid require + repeated failures. */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/**
 * Deepest route name → logical tab for `logScreenView` (dedupes list ↔ detail within same tab).
 */
const ROUTE_TO_TAB_SCREEN = {
  DocumentsList: 'Documents',
  DocumentDetail: 'Documents',
  ProfileMain: 'Profile',
  Staff: 'Profile',
  IncidentsList: 'Incidents',
  IncidentDetail: 'Incidents',
  MaintenanceList: 'Maintenance',
  MaintenanceDetail: 'Maintenance',
};

const LOGGABLE_TAB_SCREENS = new Set([
  'Dashboard',
  'Documents',
  'Checklist',
  'Profile',
  'MediaLogs',
  'InspectionReadiness',
  'Incidents',
  'Maintenance',
]);

let analyticsInstance = null;
let analyticsUnavailable = false;
let lastLoggedTabScreen = null;

const getAnalytics = () => {
  if (analyticsUnavailable) return null;
  if (analyticsInstance) return analyticsInstance;
  if (isExpoGo) {
    analyticsUnavailable = true;
    return null;
  }

  try {
    const analyticsModule = require('@react-native-firebase/analytics').default;
    analyticsInstance = analyticsModule();
    return analyticsInstance;
  } catch (_error) {
    analyticsUnavailable = true;
    if (__DEV__) {
      console.warn('Analytics module unavailable. Running analytics as no-op.');
    }
    return null;
  }
};

const normalizeParams = (params = {}) => Object.entries(params).reduce((acc, [key, value]) => {
  if (value == null) return acc;
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    acc[key] = value;
  } else {
    acc[key] = String(value);
  }
  return acc;
}, {});

export const logAnalyticsEvent = async (name, params = {}) => {
  const analytics = getAnalytics();
  if (!analytics || !name) return;
  try {
    await analytics.logEvent(name, normalizeParams(params));
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to log analytics event "${name}"`, error?.message || error);
    }
  }
};

/**
 * @param {string} activeRouteName Deepest focused route from navigation state (e.g. DocumentDetail).
 */
export const logScreenView = async (activeRouteName) => {
  if (!activeRouteName) return;
  const tabScreen = ROUTE_TO_TAB_SCREEN[activeRouteName] || activeRouteName;
  if (!LOGGABLE_TAB_SCREENS.has(tabScreen)) return;
  if (tabScreen === lastLoggedTabScreen) return;

  const analytics = getAnalytics();
  if (!analytics) return;
  try {
    await analytics.logScreenView({
      screen_name: tabScreen,
      screen_class: 'MainTabs',
    });
    lastLoggedTabScreen = tabScreen;
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to log screen_view for "${tabScreen}"`, error?.message || error);
    }
  }
};

export default {
  logAnalyticsEvent,
  logScreenView,
};
