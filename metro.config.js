/**
 * Metro Configuration
 * 
 * This file configures Metro bundler for React Native/Expo.
 * The key fix: Disable unstable_enablePackageExports to resolve
 * Firebase JS SDK "component not registered" errors.
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Firebase JS SDK "component auth has not been registered yet" error
// This disables Metro's new package export resolution which conflicts with Firebase SDK
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
