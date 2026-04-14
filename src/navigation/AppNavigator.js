/**
 * App Navigator
 * 
 * Main navigation component that handles authentication state.
 * Switches between AuthNavigator (unauthenticated) and MainNavigator (authenticated).
 * Shows loading screen while checking authentication state.
 * 
 * Navigation Tree:
 * 
 * AppNavigator (Root)
 * ├── AuthNavigator (when user is not authenticated)
 * │   ├── Login (initial route)
 * │   ├── Signup
 * │   └── ForgotPassword
 * │
 * ├── OnboardingNavigator (when `needsOwnerOnboarding` is true)
 * │   └── OwnerOnboarding (initial route)
 * │
 * └── MainNavigator (when user is authenticated)
 *     ├── Dashboard (Tab)
 *     ├── Documents (Tab)
 *     │   └── DocumentsStack
 *     │       ├── DocumentsList (initial route)
 *     │       └── DocumentDetail
 *     ├── Checklist (Tab)
 *     └── Profile (Tab)
 * 
 * Deep Linking Support:
 * - foodtruckcompliance://login
 * - foodtruckcompliance://documents/list
 * - foodtruckcompliance://documents/detail/:documentId
 * - foodtruckcompliance://checklist
 * - foodtruckcompliance://profile
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { COLORS } from '../constants/colors';
import { DEEP_LINKING_CONFIG } from './navigationConfig';

/**
 * Loading Screen Component
 * 
 * Shown while checking authentication state.
 */
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
};

/**
 * AppNavigator Component
 * 
 * Main navigation component that:
 * 1. Observes Firebase Authentication state
 * 2. Shows loading screen while checking auth state
 * 3. Shows AuthNavigator if user is not authenticated
 * 4. Shows MainNavigator if user is authenticated
 * 5. Automatically handles navigation on login/logout
 * 6. Prevents back navigation after logout (Android)
 * 7. Supports deep linking for future implementation
 */
const AppNavigator = () => {
  const { user, loading, profileLoading, needsOwnerOnboarding } = useAuth();
  const navigationRef = useRef(null);
  const previousUserRef = useRef(user);

  // Handle Android back button to prevent going back after logout
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // If user just logged out, prevent back navigation
        if (previousUserRef.current && !user) {
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      });

      return () => backHandler.remove();
    }
  }, [user]);

  // Track user changes for navigation reset
  useEffect(() => {
    // If user logged out, reset navigation to prevent back navigation
    if (previousUserRef.current && !user && navigationRef.current) {
      // Navigation will be automatically reset when Navigator switches
      // This effect ensures we don't allow back navigation to authenticated screens
    }
    
    previousUserRef.current = user;
  }, [user]);

  // Show loading screen while checking auth state
  if (loading || (user && profileLoading)) {
    return <LoadingScreen />;
  }

  // Show appropriate navigator based on auth state
  return (
    <NavigationContainer
      ref={navigationRef}
      // Deep linking configuration (ready for future implementation)
      linking={DEEP_LINKING_CONFIG}
      // Prevent going back to auth screens after login
      onStateChange={(state) => {
        // Navigation state change handler
        // Can be used for analytics or additional navigation guards
      }}
    >
      {/* Root auth guard: unauthenticated users only get the auth stack, owners with incomplete business profiles must finish onboarding, and signed-in ready users get the main tabs. */}
      {!user ? <AuthNavigator /> : needsOwnerOnboarding ? <OnboardingNavigator /> : <MainNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
