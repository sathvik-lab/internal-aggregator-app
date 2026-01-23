/**
 * Main App Component
 * 
 * Root component that sets up providers and navigation.
 * Wraps the app with AuthProvider and PaperProvider.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Inner App Component
 * Uses theme hook to set StatusBar style
 */
const AppContent = () => {
  const { isDark } = useTheme();
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <PaperProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
