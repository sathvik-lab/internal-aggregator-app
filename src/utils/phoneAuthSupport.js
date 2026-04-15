import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isPlaceholderFirebaseKey = (value) => {
  if (!value || typeof value !== 'string') return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('placeholder')
    || lower.includes('your-')
    || lower.includes('example')
  );
};

/**
 * If non-null, phone + reCAPTCHA flow should not run; show this message instead.
 * Does not detect every native-module failure — see FIREBASE_SETUP.md for builds.
 */
export const getPhoneAuthBlockReason = () => {
  if (Platform.OS === 'web') {
    return 'Phone sign-in is not available on web. Use email sign-in, or open the iOS/Android app.';
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return 'Phone sign-in needs a development or production build with native modules. Expo Go does not support this flow reliably. From project root run: npx expo run:android or npx expo run:ios (see FIREBASE_SETUP.md).';
  }

  const apiKey = Constants.expoConfig?.extra?.firebaseApiKey;
  const projectId = Constants.expoConfig?.extra?.firebaseProjectId;
  if (isPlaceholderFirebaseKey(apiKey) || isPlaceholderFirebaseKey(projectId)) {
    return 'Firebase is not configured (missing or placeholder keys in .env). Configure .env, restart the bundler, and rebuild the native app.';
  }

  return null;
};

export const isPhoneAuthSupported = () => getPhoneAuthBlockReason() === null;
