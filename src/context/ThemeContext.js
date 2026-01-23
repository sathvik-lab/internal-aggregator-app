/**
 * Theme Context
 * 
 * Provides theme management (light/dark mode) with AsyncStorage persistence
 * and system theme detection.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme_preference';

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Light theme colors
export const lightColors = {
  // Primary brand colors
  primary: '#1B365D',        // Deep Navy
  primaryDark: '#0F2439',    // Darker navy
  primaryLight: '#2C5282',   // Lighter navy
  
  // Secondary colors
  secondary: '#4A5568',      // Slate Grey
  secondaryLight: '#718096', // Lighter grey
  
  // Accent colors
  accent: '#007AFF',         // Trust Blue
  accentLight: '#5AC8FA',    // Light blue
  
  // Background colors
  background: '#F7FAFC',     // Light Grey/White
  backgroundSecondary: '#EDF2F7', // Slightly darker
  surface: '#FFFFFF',        // White
  
  // Status colors (same in both themes for consistency)
  success: '#38A169',
  successLight: '#68D391',
  warning: '#D69E2E',
  warningLight: '#F6E05E',
  error: '#E53E3E',
  errorLight: '#FC8181',
  info: '#3182CE',
  
  // Text colors
  text: '#2D3748',           // Dark Charcoal
  textSecondary: '#4A5568',
  textLight: '#718096',
  textInverse: '#FFFFFF',
  
  // Border and divider colors
  border: '#E2E8F0',
  borderDark: '#CBD5E0',
  divider: '#E2E8F0',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  
  // Compliance status colors
  compliant: '#38A169',
  atRisk: '#D69E2E',
  nonCompliant: '#E53E3E',
  pending: '#718096',
};

// Dark theme colors
export const darkColors = {
  // Primary brand colors (lighter for dark mode)
  primary: '#4A90E2',        // Lighter blue for dark mode
  primaryDark: '#2C5282',    // Medium blue
  primaryLight: '#5AC8FA',   // Light blue
  
  // Secondary colors
  secondary: '#A0AEC0',      // Lighter grey
  secondaryLight: '#CBD5E0', // Even lighter grey
  
  // Accent colors
  accent: '#5AC8FA',         // Bright blue
  accentLight: '#90CDF4',    // Light blue
  
  // Background colors
  background: '#1A202C',      // Dark grey
  backgroundSecondary: '#2D3748', // Slightly lighter dark grey
  surface: '#2D3748',        // Dark surface
  
  // Status colors (same as light for consistency)
  success: '#38A169',
  successLight: '#68D391',
  warning: '#D69E2E',
  warningLight: '#F6E05E',
  error: '#E53E3E',
  errorLight: '#FC8181',
  info: '#3182CE',
  
  // Text colors
  text: '#F7FAFC',           // Light text
  textSecondary: '#CBD5E0',
  textLight: '#A0AEC0',
  textInverse: '#1A202C',    // Dark text for light backgrounds
  
  // Border and divider colors
  border: '#4A5568',
  borderDark: '#718096',
  divider: '#4A5568',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Compliance status colors
  compliant: '#38A169',
  atRisk: '#D69E2E',
  nonCompliant: '#E53E3E',
  pending: '#718096',
};

const ThemeContext = createContext({
  theme: THEME_MODES.LIGHT,
  colors: lightColors,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * Theme Provider Component
 * 
 * Provides theme context with safe initialization:
 * - Always provides valid default values (light theme) immediately
 * - Loads saved preference from AsyncStorage asynchronously
 * - Updates theme when saved preference loads (causes re-render)
 * - Handles system theme changes automatically
 */
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Initialize with system theme detection (synchronous, always available)
  // This ensures we always have a valid isDark value from the start
  const [themeMode, setThemeMode] = useState(THEME_MODES.SYSTEM);
  const [isDark, setIsDark] = useState(() => {
    // Initialize based on system theme (synchronous)
    // This provides a valid value immediately, even before AsyncStorage loads
    return systemColorScheme === 'dark';
  });

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Update isDark based on theme mode and system preference
  useEffect(() => {
    if (themeMode === THEME_MODES.SYSTEM) {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === THEME_MODES.DARK);
    }
  }, [themeMode, systemColorScheme]);

  // Get current colors based on theme
  const colors = isDark ? darkColors : lightColors;

  // Set theme mode
  const setTheme = useCallback(async (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.warn(`Invalid theme mode: ${mode}`);
      return;
    }

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);

  // Toggle between light and dark (not system)
  const toggleTheme = useCallback(async () => {
    const newMode = isDark ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    await setTheme(newMode);
  }, [isDark, setTheme]);

  // Always provide a valid value object, even during async initialization
  // This ensures useTheme() never returns undefined values
  const value = {
    theme: themeMode,
    colors,
    isDark,
    setTheme,
    toggleTheme,
  };

  // The context provider always renders children immediately with valid default values
  // When AsyncStorage loads the saved preference, it updates state and causes a re-render
  // This is safe because:
  // 1. Default values are always valid (light theme)
  // 2. Components using useTheme() will re-render when theme changes
  // 3. No component will ever receive undefined values
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 * 
 * Always returns a valid context object with:
 * - theme: Current theme mode (LIGHT, DARK, or SYSTEM)
 * - colors: Current color scheme object
 * - isDark: Boolean indicating if dark mode is active
 * - setTheme: Function to change theme mode
 * - toggleTheme: Function to toggle between light and dark
 * 
 * Safety guarantees:
 * - Context always provides valid default values (light theme)
 * - isDark is initialized synchronously from system color scheme
 * - No undefined values are ever returned
 * - AsyncStorage loading happens after initial render (non-blocking)
 * 
 * @throws {Error} If called outside ThemeProvider
 * @returns {Object} Theme context object
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  // Defensive check: ensure context has all required properties
  // This should never happen, but provides extra safety
  if (!context.colors || context.isDark === undefined) {
    console.warn('Theme context is missing required properties. Using defaults.');
    return {
      theme: THEME_MODES.LIGHT,
      colors: lightColors,
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  
  return context;
};

export default ThemeContext;
