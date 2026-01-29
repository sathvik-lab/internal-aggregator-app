/**
 * Firebase Configuration and Initialization
 * 
 * This file sets up Firebase services for the app using the Firebase JS SDK (v9+ modular API).
 * The Firebase JS SDK works with Expo Go and doesn't require native builds.
 * 
 * Setup Process:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Authentication, Firestore Database, and Storage in Firebase Console
 * 3. Copy your Firebase config values to .env file (see .env.example)
 * 4. The config is exposed via expo-constants from app.json
 * 
 * Note: If you need Firebase Analytics, Crashlytics, or other native features,
 * you'll need to switch to @react-native-firebase and use Development Builds.
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
// These are exposed via expo-constants from app.json
const firebaseApiKey = Constants.expoConfig?.extra?.firebaseApiKey;
const firebaseAuthDomain = Constants.expoConfig?.extra?.firebaseAuthDomain;
const firebaseProjectId = Constants.expoConfig?.extra?.firebaseProjectId;
const firebaseStorageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket;
const firebaseMessagingSenderId = Constants.expoConfig?.extra?.firebaseMessagingSenderId;
const firebaseAppId = Constants.expoConfig?.extra?.firebaseAppId;

// Debug: Log config values (without exposing sensitive data)
console.log('Firebase config check:', {
  hasApiKey: !!firebaseApiKey,
  hasAuthDomain: !!firebaseAuthDomain,
  hasProjectId: !!firebaseProjectId,
  hasStorageBucket: !!firebaseStorageBucket,
  hasMessagingSenderId: !!firebaseMessagingSenderId,
  hasAppId: !!firebaseAppId,
  projectId: firebaseProjectId ? `${firebaseProjectId.substring(0, 10)}...` : 'missing',
});

// Check if Firebase configuration is missing
const isConfigMissing = !firebaseApiKey || !firebaseAuthDomain || !firebaseProjectId || 
                        !firebaseStorageBucket || !firebaseMessagingSenderId || !firebaseAppId;

if (isConfigMissing) {
  const setupError = `
╔════════════════════════════════════════════════════════════════╗
║  FIREBASE NOT CONFIGURED                                     ║
╠════════════════════════════════════════════════════════════════╣
║  Firebase configuration is missing. The app will use mock    ║
║  services for development, but Firebase features will not     ║
║  work until configured.                                       ║
║                                                                ║
║  To configure Firebase:                                        ║
║  1. Create a .env file from .env.example                      ║
║  2. Add your Firebase project credentials                     ║
║  3. Restart the Expo development server                        ║
║                                                                ║
║  See FIREBASE_SETUP.md for detailed instructions.            ║
╚════════════════════════════════════════════════════════════════╝
  `;
  console.warn(setupError);
  // Don't throw - allow app to run with mock services in development
  // This allows developers to test the UI before setting up Firebase
}

const firebaseConfig = {
  apiKey: firebaseApiKey || 'placeholder-api-key',
  authDomain: firebaseAuthDomain || 'placeholder-project.firebaseapp.com',
  projectId: firebaseProjectId || 'placeholder-project-id',
  storageBucket: firebaseStorageBucket || 'placeholder-project.appspot.com',
  messagingSenderId: firebaseMessagingSenderId || 'placeholder-sender-id',
  appId: firebaseAppId || 'placeholder-app-id',
};

// Initialize Firebase app
let app;
let _authInstance = null; // Internal variable to store auth instance (lazy initialization)
let db;
let storage;

try {
  if (isConfigMissing) {
    console.warn('⚠️  Firebase configuration is missing. Cannot initialize Firebase.');
    console.warn('⚠️  Please configure your .env file with valid Firebase credentials.');
    
    // In production, throw error to prevent deployment with missing config
    // In development, allow app to run with mock services (as stated in comment on lines 67-68)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase configuration is missing. Please configure your .env file.');
    }
    
    // In development, set app to null and let services handle mock behavior
    // The service files (auth.js, firestore.js, storage.js) will use mock implementations
    app = null;
    db = null;
    storage = null;
    console.warn('⚠️  App will run with mock services. Firebase features will not work until configured.');
  } else {
    // Validate config values are not just placeholder strings
    // Check for both .env.example placeholders (your-*-here, your-*-id) and 
    // fallback placeholders (placeholder-*-key, placeholder-*-id)
    // This catches cases where users copy .env.example without updating values
    const isPlaceholderValue = (value) => {
      if (!value) return true;
      const lowerValue = value.toLowerCase();
      // Check for common placeholder patterns
      return (
        lowerValue.includes('placeholder') ||
        lowerValue.includes('your-') ||
        lowerValue === 'example' ||
        lowerValue.includes('example-')
      );
    };
    
    if (
      isPlaceholderValue(firebaseApiKey) ||
      isPlaceholderValue(firebaseProjectId) ||
      isPlaceholderValue(firebaseAppId) ||
      isPlaceholderValue(firebaseAuthDomain) ||
      isPlaceholderValue(firebaseStorageBucket) ||
      isPlaceholderValue(firebaseMessagingSenderId)
    ) {
      // In production, throw error
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase configuration contains placeholder values. Please update your .env file with real Firebase credentials.');
      }
      
      // In development, allow placeholder values (for testing)
      console.warn('⚠️  Firebase configuration contains placeholder values. App will run with mock services.');
      console.warn('⚠️  Please update your .env file with real Firebase credentials from Firebase Console.');
      app = null;
      db = null;
      storage = null;
    } else {
      // Initialize Firebase app first
      // Check if app is already initialized (for hot reload scenarios)
      const existingApps = getApps();
      if (existingApps.length > 0) {
        // Use existing app instance (default app)
        try {
          app = getApp(); // Get default app
          console.log('✅ Using existing Firebase app instance (hot reload)');
        } catch (e) {
          app = existingApps[0];
          console.log('✅ Using existing Firebase app instance');
        }
      } else {
        // Initialize new app instance (this creates the default app)
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized successfully');
      }
      console.log(`   Project: ${firebaseProjectId}`);
      console.log(`   App name: ${app.name}`);
      
      // Ensure app is fully initialized before accessing services
      // Verify app instance is valid
      if (!app || !app.name) {
        throw new Error('Firebase app instance is invalid. Please check your Firebase configuration.');
      }
      
      // Firebase Auth will be initialized lazily on first access
      // This prevents "component not registered" errors that occur when
      // trying to initialize auth immediately after app initialization
      // Auth initialization happens via getAuthInstance() when first accessed
      console.log('⚠️  Firebase Auth will be initialized on first access (lazy initialization)');
      
      // Initialize Firestore
      db = getFirestore(app);
      console.log('✅ Firestore initialized successfully');
      
      // Initialize Firebase Storage
      storage = getStorage(app);
      console.log('✅ Firebase Storage initialized successfully');
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Error details:', {
    hasApiKey: !!firebaseApiKey,
    hasAuthDomain: !!firebaseAuthDomain,
    hasProjectId: !!firebaseProjectId,
    hasStorageBucket: !!firebaseStorageBucket,
    hasMessagingSenderId: !!firebaseMessagingSenderId,
    hasAppId: !!firebaseAppId,
    errorCode: error.code,
    errorMessage: error.message,
  });
  
  // In production, re-throw to prevent deployment
  // In development, allow app to continue with mock services
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
  
  // In development, set services to null and let mock services handle it
  console.warn('⚠️  Firebase initialization failed. App will run with mock services.');
  app = null;
  db = null;
  storage = null;
}

// Enable offline persistence for Firestore (Web only)
// NOTE: enableIndexedDbPersistence() is only available in browser environments with IndexedDB support.
// React Native/Expo does not support IndexedDB, so this will fail with 'unimplemented' error.
// For React Native offline persistence, use @react-native-firebase with native builds instead.
// We only enable it on web platform to avoid runtime errors in React Native.
if (db && Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence failed: Multiple tabs may be open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required
      console.warn('Firestore persistence is not available in this browser');
    } else {
      console.warn('Firestore persistence error:', err);
    }
  });
} else if (!db) {
  // db is null (Firebase not configured) - skip persistence setup
  // Mock services will handle data persistence
} else {
  // For React Native/Expo, offline persistence is not available with Firebase JS SDK
  // To enable offline persistence in React Native, use @react-native-firebase instead
  // This is expected behavior and not an error
  console.log('Firestore offline persistence: Not available in React Native with Firebase JS SDK. Use @react-native-firebase for native offline support.');
}

// Lazy initialization function for auth with retry mechanism
// This handles the "component not registered" error by retrying after a short delay
const getAuthInstance = () => {
  if (_authInstance) {
    return _authInstance;
  }
  
  if (!app) {
    // In development, allow app to run without Firebase (mock services will handle it)
    // In production, this should not happen (config should be validated)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase app must be initialized before accessing auth');
    }
    // In development, throw a specific error that mock services can catch
    throw new Error('Firebase app is not initialized. Using mock services in development.');
  }
  
  // Use initializeAuth() with AsyncStorage for React Native
  // On web, use getAuth() which automatically uses browser localStorage
  try {
    if (Platform.OS === 'web') {
      // Web platform: use getAuth() which handles persistence automatically via localStorage
      _authInstance = getAuth(app);
      console.log('✅ Firebase Auth initialized for web (lazy)');
      return _authInstance;
    } else {
      // React Native: use initializeAuth() with AsyncStorage persistence
      _authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('✅ Firebase Auth initialized with AsyncStorage persistence (lazy)');
      return _authInstance;
    }
  } catch (error) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized' || 
        error.message?.includes('already-initialized') ||
        error.message?.includes('already been initialized')) {
      console.log('Auth already initialized, retrieving existing instance...');
      _authInstance = getAuth(app);
      console.log('✅ Firebase Auth retrieved (already initialized)');
      return _authInstance;
    } else if (error.message?.includes('has not been registered yet') ||
               error.message?.includes('component has not been registered')) {
      // Component not ready - throw to let AuthContext retry
      // Don't log error here - AuthContext will handle retry logging to avoid spam
      throw new Error('Firebase Auth component is not ready yet. AuthContext will retry automatically.');
    } else {
      // Other errors
      console.error('Failed to initialize Firebase Auth:', error);
      throw new Error(`Failed to initialize Firebase Auth: ${error.message}. Please check your Firebase configuration and ensure Authentication is enabled in Firebase Console.`);
    }
  }
};

// Export a function to get the auth instance (lazy initialization)
// This ensures Firebase SDK functions receive an actual Auth instance, not a Proxy
// Firebase SDK functions perform type checking and expect a real Auth object
// IMPORTANT: Always use getFirebaseAuth() when passing auth to Firebase SDK functions
// This ensures they receive a real Auth instance, not a Proxy
export const getFirebaseAuth = () => {
  return getAuthInstance();
};

// Export other services
export { db, storage };
export default app;
