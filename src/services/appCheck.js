/**
 * Firebase App Check for Firestore + Storage when using the Firebase JS SDK.
 * Must run before getFirestore / getStorage on the same FirebaseApp.
 *
 * @see FIREBASE_SETUP.md (App Check)
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

/** Public reCAPTCHA test key (Google); only used to satisfy provider init in __DEV__ when no site key set. Debug exchange bypasses reCAPTCHA. */
const RECAPTCHA_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function buildProvider(siteKey, useV3) {
  const key = siteKey || RECAPTCHA_TEST_SITE_KEY;
  return useV3 ? new ReCaptchaV3Provider(key) : new ReCaptchaEnterpriseProvider(key);
}

function safeInitAppCheck(app, options) {
  try {
    return initializeAppCheck(app, options);
  } catch (e) {
    if (e?.code === 'app-check/already-initialized') {
      return null;
    }
    console.warn('[App Check]', e?.message || e);
    return null;
  }
}

/** @param {object | null | undefined} app FirebaseApp from firebase/app */
export function initFirebaseAppCheck(app) {
  if (!app) {
    return null;
  }

  const extra = Constants.expoConfig?.extra || {};
  const siteKey = typeof extra.firebaseAppCheckSiteKey === 'string' ? extra.firebaseAppCheckSiteKey.trim() : '';
  const debugTokenFromEnv =
    typeof extra.firebaseAppCheckDebugToken === 'string' ? extra.firebaseAppCheckDebugToken.trim() : '';
  const useV3 = extra.firebaseAppCheckUseV3 === true;

  const g = globalThis;
  const isWeb = Platform.OS === 'web';

  if (!__DEV__) {
    try {
      delete g.FIREBASE_APPCHECK_DEBUG_TOKEN;
    } catch (_e) {
      g.FIREBASE_APPCHECK_DEBUG_TOKEN = undefined;
    }
  }

  if (__DEV__) {
    if (debugTokenFromEnv.length > 0) {
      g.FIREBASE_APPCHECK_DEBUG_TOKEN = debugTokenFromEnv;
    } else {
      g.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    // Debug path uses exchangeDebugToken; never load Enterprise/grecaptcha on native Metro — always V3 + optional real site key.
    const provider = new ReCaptchaV3Provider(siteKey || RECAPTCHA_TEST_SITE_KEY);
    const instance = safeInitAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
    if (__DEV__) {
      console.info(
        '[App Check] Debug enabled. If using FIREBASE_APPCHECK_DEBUG_TOKEN=true, copy the printed token from Metro/console into Firebase Console → App Check → Manage debug tokens.'
      );
    }
    return instance;
  }

  if (isWeb && siteKey) {
    return safeInitAppCheck(app, {
      provider: buildProvider(siteKey, useV3),
      isTokenAutoRefreshEnabled: true,
    });
  }

  if (isWeb && !siteKey) {
    console.warn(
      '[App Check] Web production: FIREBASE_APPCHECK_SITE_KEY missing — App Check not initialized. Leave Firestore/Storage enforcement OFF in Console until this is set.'
    );
    return null;
  }

  console.warn(
    '[App Check] iOS/Android production: Firebase JS SDK has no built-in DeviceCheck / Play Integrity provider. App Check not initialized — defer Console enforcement until you adopt a supported path (see FIREBASE_SETUP.md §9).'
  );
  return null;
}
