const MAIN_TAB_ROUTE_NAMES = new Set([
  'Dashboard',
  'Documents',
  'Checklist',
  'Profile',
  'MediaLogs',
  'InspectionReadiness',
]);

let analyticsInstance = null;
let analyticsUnavailable = false;

const getAnalytics = () => {
  if (analyticsUnavailable) return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    // Lazy require avoids crashing when native module is unavailable (e.g., Expo Go).
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

export const logScreenView = async (screenName) => {
  if (!screenName || !MAIN_TAB_ROUTE_NAMES.has(screenName)) return;
  const analytics = getAnalytics();
  if (!analytics) return;
  try {
    await analytics.logScreenView({
      screen_name: screenName,
      screen_class: 'MainTabs',
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to log screen_view for "${screenName}"`, error?.message || error);
    }
  }
};

export default {
  logAnalyticsEvent,
  logScreenView,
};
