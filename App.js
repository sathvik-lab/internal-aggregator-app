/**
 * Main App Component
 * 
 * Root component that sets up providers and navigation.
 * Wraps the app with AuthProvider and PaperProvider.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
