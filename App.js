/**
 * Main App Component
 * 
 * Root component that sets up providers and navigation.
 * Wraps the app with ThemeProvider, PaperProvider, and AuthProvider.
 * 
 * Provider Hierarchy:
 * 1. ThemeProvider - Provides theme context (must be outermost for theme access)
 * 2. PaperProvider - Provides Material Design theme for react-native-paper
 * 3. AuthProvider - Provides authentication context
 * 4. AppContent - Uses theme hook (safe because it's inside ThemeProvider)
 */

import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { createPaperTheme } from './src/utils/paperTheme';

/**
 * Inner App Component
 * 
 * This component is rendered inside ThemeProvider, so useTheme() is safe to use.
 * The theme context always provides a valid default value (light theme) even
 * before AsyncStorage loads the saved preference, so there's no risk of
 * accessing undefined values.
 * 
 * StatusBar style updates automatically when isDark changes via React's
 * re-render mechanism when the theme preference loads from AsyncStorage.
 * 
 * PaperProvider receives a theme prop that synchronizes with ThemeContext,
 * ensuring react-native-paper components (Switch, TextInput, FAB, etc.) respond
 * to theme changes.
 */
const AppContent = () => {
  // Safe to use useTheme() here because AppContent is rendered inside ThemeProvider
  // The context always provides a valid default value, even during async initialization
  const { colors, isDark } = useTheme();
  
  // Create Paper theme from custom theme colors
  // Memoize to prevent unnecessary re-creation on every render
  const paperTheme = useMemo(() => {
    return createPaperTheme(colors, isDark);
  }, [colors, isDark]);
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
