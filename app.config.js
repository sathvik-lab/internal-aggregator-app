/**
 * Expo Configuration
 * 
 * This file replaces app.json to allow dynamic configuration with environment variables.
 * Environment variables are loaded from .env file (see .env.example)
 */

// Load environment variables from .env file
let envLoaded = false;
let envFileMissing = false;

try {
  const result = require('dotenv').config();
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      // .env file is missing - this is a setup issue that needs attention
      envFileMissing = true;
    } else {
      // Other error loading .env file
      console.warn('Warning: Error loading .env file:', result.error.message);
    }
  } else {
    // .env file loaded successfully
    envLoaded = true;
  }
} catch (error) {
  // Fallback: dotenv.config() shouldn't throw, but handle it just in case
  console.warn('Warning: Could not load .env file. Using default values or environment variables.');
}

// Get Firebase configuration from environment variables
const firebaseConfig = {
  firebaseApiKey: process.env.FIREBASE_API_KEY || null,
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || null,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
  firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
  firebaseAppId: process.env.FIREBASE_APP_ID || null,
};

// Helper function to convert camelCase/PascalCase to SNAKE_CASE
// Examples: 'firebaseApiKey' -> 'FIREBASE_API_KEY', 'firebaseAuthDomain' -> 'FIREBASE_AUTH_DOMAIN'
const camelToSnakeCase = (str) => {
  // Remove 'firebase' prefix
  const withoutPrefix = str.replace(/^firebase/, '');
  // Insert underscore before uppercase letters (except at the start)
  // This handles both camelCase (apiKey -> api_Key) and PascalCase (ApiKey -> Api_Key)
  const withUnderscores = withoutPrefix.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  // Convert to uppercase
  const snakeCase = withUnderscores.toUpperCase();
  // Add FIREBASE_ prefix
  return 'FIREBASE_' + snakeCase;
};

// Check if Firebase configuration is missing
const missingConfig = Object.entries(firebaseConfig).filter(([_, value]) => !value);

if (missingConfig.length > 0) {
  const missingKeys = missingConfig.map(([key]) => camelToSnakeCase(key)).join(', ');
  
  // Create a more prominent warning message
  let setupMessage = '';
  
  if (envFileMissing) {
    // .env file is completely missing - this is the most common setup issue
    setupMessage = `
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  .env FILE MISSING - FIREBASE NOT CONFIGURED              ║
╠════════════════════════════════════════════════════════════════╣
║  The .env file is missing. Firebase configuration cannot be   ║
║  loaded. The app will fail to connect to Firebase services.   ║
║                                                                ║
║  To fix this:                                                  ║
║  1. Copy .env.example to .env in the project root             ║
║  2. Fill in your Firebase project values from:                ║
║     Firebase Console > Project Settings > General > Your apps ║
║  3. Restart the Expo development server                        ║
║                                                                ║
║  Missing variables: ${missingKeys.padEnd(39)}║
║                                                                ║
║  ⚠️  Without Firebase config, authentication and data will    ║
║     not work. The app will show errors when trying to use      ║
║     Firebase services.                                         ║
╚════════════════════════════════════════════════════════════════╝
    `;
  } else {
    // .env file exists but some values are missing
    setupMessage = `
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  FIREBASE CONFIGURATION INCOMPLETE                        ║
╠════════════════════════════════════════════════════════════════╣
║  Some Firebase environment variables are missing from .env.    ║
║                                                                ║
║  To fix this:                                                  ║
║  1. Open .env file in the project root                        ║
║  2. Fill in the missing Firebase project values:              ║
║     Firebase Console > Project Settings > General > Your apps ║
║  3. Restart the Expo development server                        ║
║                                                                ║
║  Missing variables: ${missingKeys.padEnd(39)}║
║                                                                ║
║  ⚠️  Without complete Firebase config, authentication and     ║
║     data will not work properly.                              ║
╚════════════════════════════════════════════════════════════════╝
    `;
  }
  
  // Always log the warning prominently
  console.warn(setupMessage);
  
  // In development, this is a warning (app can still run with mocks)
  // In production, throw an error to prevent deployment with missing config
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Firebase configuration is missing. Please set the following environment variables: ${missingKeys}`);
  }
}

module.exports = {
  expo: {
    name: 'Internal Aggregator App',
    slug: 'internal-aggregator-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1B365D',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.internalaggregator.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1B365D',
      },
      package: 'com.internalaggregator.app',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Firebase configuration from environment variables
      // These are accessed via expo-constants in the app
      ...firebaseConfig,
    },
  },
};
