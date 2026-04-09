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

import React, { useMemo, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  // Suppress non-critical cross-origin security errors on web
  // These are typically caused by browser extensions or DevTools, not app code
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Override window.onerror to catch SecurityErrors early
      const originalOnError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        // Check if this is a cross-origin SecurityError
        if (
          error?.name === 'SecurityError' ||
          (typeof message === 'string' && (
            message.includes('cross-origin') ||
            message.includes('Blocked a frame') ||
            message.includes("Failed to read a named property 'document'")
          ))
        ) {
          // Suppress these errors - they're from browser extensions/DevTools, not our code
          return true; // Return true to prevent default error handling
        }
        // Call original handler for other errors
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };

      // Catch errors via addEventListener (capture phase)
      const errorHandler = (event) => {
        if (
          event.error &&
          event.error.name === 'SecurityError' &&
          (event.error.message?.includes('cross-origin') ||
           event.error.message?.includes('Blocked a frame') ||
           event.error.message?.includes("Failed to read a named property 'document'"))
        ) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      };
      window.addEventListener('error', errorHandler, true);

      // Catch unhandled promise rejections
      const rejectionHandler = (event) => {
        if (
          event.reason &&
          (event.reason.name === 'SecurityError' ||
           (typeof event.reason === 'string' && (
             event.reason.includes('cross-origin') ||
             event.reason.includes('Blocked a frame')
           )))
        ) {
          event.preventDefault();
        }
      };
      window.addEventListener('unhandledrejection', rejectionHandler);

      // Also filter console.error for these specific errors
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const errorString = args.join(' ');
        if (
          errorString.includes('SecurityError') &&
          (errorString.includes('cross-origin') ||
           errorString.includes('Blocked a frame') ||
           errorString.includes("Failed to read a named property 'document'"))
        ) {
          // Suppress these console errors
          return;
        }
        // Call original console.error for other errors
        originalConsoleError.apply(console, args);
      };

      return () => {
        // Restore original handlers on cleanup
        window.onerror = originalOnError;
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', rejectionHandler);
        console.error = originalConsoleError;
      };
    }
  }, []);

  return (
    <View style={styles.root}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
