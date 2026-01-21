/**
 * Expo Configuration
 * 
 * This file replaces app.json to allow dynamic configuration with environment variables.
 * Environment variables are loaded from .env file (see .env.example)
 */

// Load environment variables from .env file
require('dotenv').config();

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
      firebaseApiKey: process.env.FIREBASE_API_KEY || null,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || null,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
      firebaseAppId: process.env.FIREBASE_APP_ID || null,
    },
  },
};
