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

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
// These are exposed via expo-constants from app.json
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 'placeholder-api-key',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 'placeholder-project.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 'placeholder-project-id',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 'placeholder-project.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || 'placeholder-sender-id',
  appId: Constants.expoConfig?.extra?.firebaseAppId || 'placeholder-app-id',
};

// Initialize Firebase app
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // In development, you might want to throw here to catch config issues early
  throw error;
}

// Initialize Firebase Auth with AsyncStorage persistence
// This allows auth state to persist across app restarts
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If auth is already initialized (e.g., hot reload), get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence for Firestore
// This allows the app to work offline and sync when connection is restored
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs may be open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required
    console.warn('Firestore persistence is not available in this environment');
  }
});

// Initialize Firebase Storage
const storage = getStorage(app);

// Export Firebase services
export { auth, db, storage };
export default app;
