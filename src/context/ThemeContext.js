/**
 * Theme Context
 * 
 * Provides theme management (light/dark mode) with AsyncStorage persistence
 * and system theme detection. Integrates with the new theme system.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme';

const THEME_STORAGE_KEY = '@app_theme_preference';

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Export legacy color exports for backward compatibility
export const lightColors = lightTheme.colors;
export const darkColors = darkTheme.colors;

const ThemeContext = createContext(undefined);

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

  // Get current theme based on isDark
  const currentTheme = isDark ? darkTheme : lightTheme;

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
  // Now includes full theme system: colors, typography, spacing, shadows
  const value = {
    theme: themeMode,
    colors: currentTheme.colors,
    typography: currentTheme.typography,
    spacing: currentTheme.spacing,
    shadows: currentTheme.shadows,
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

  return context;
};

export default ThemeContext;
