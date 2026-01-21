/**
 * App Navigator
 * 
 * Main navigation component that handles authentication state.
 * Switches between AuthNavigator (unauthenticated) and MainNavigator (authenticated).
 * Shows loading screen while checking authentication state.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../constants/colors';

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
 */
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // Show appropriate navigator based on auth state
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
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
