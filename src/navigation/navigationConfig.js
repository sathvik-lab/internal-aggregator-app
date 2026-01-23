/**
 * Navigation Configuration
 * 
 * Centralized navigation configuration including:
 * - Deep linking structure
 * - Navigation guards
 * - Route names constants
 * - Navigation helpers
 */

/**
 * Navigation Route Names
 * 
 * Centralized route names to prevent typos and ensure consistency
 */
export const ROUTES = {
  // Auth Stack
  AUTH: {
    LOGIN: 'Login',
    SIGNUP: 'Signup',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  
  // Main Tabs
  MAIN: {
    DASHBOARD: 'Dashboard',
    DOCUMENTS: 'Documents',
    CHECKLIST: 'Checklist',
    PROFILE: 'Profile',
  },
  
  // Documents Stack
  DOCUMENTS: {
    LIST: 'DocumentsList',
    DETAIL: 'DocumentDetail',
  },
  
  // Future routes (for deep linking)
  FUTURE: {
    REPORTS: 'Reports',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
  },
};

/**
 * Deep Linking Configuration
 * 
 * Structure for future deep linking implementation
 * Example URLs:
 * - internalaggregator://documents/123
 * - internalaggregator://checklist/today
 * - internalaggregator://profile
 */
export const DEEP_LINKING_CONFIG = {
  prefixes: ['internalaggregator://', 'https://internalaggregator.app'],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',
      
      // Main tabs
      Dashboard: 'dashboard',
      Documents: {
        path: 'documents',
        screens: {
          DocumentsList: 'list',
          DocumentDetail: 'detail/:documentId',
        },
      },
      Checklist: 'checklist',
      Profile: 'profile',
      
      // Future screens
      Reports: 'reports',
      Settings: 'settings',
      Notifications: 'notifications',
    },
  },
};

/**
 * Navigation Guards
 * 
 * Functions to check if navigation should be allowed
 */
export const NavigationGuards = {
  /**
   * Check if user can navigate to a protected route
   * @param {Object} user - Current user object
   * @param {string} routeName - Route name to navigate to
   * @returns {boolean} - Whether navigation is allowed
   */
  canNavigateToProtectedRoute: (user, routeName) => {
    const protectedRoutes = [
      ROUTES.MAIN.DASHBOARD,
      ROUTES.MAIN.DOCUMENTS,
      ROUTES.MAIN.CHECKLIST,
      ROUTES.MAIN.PROFILE,
    ];
    
    if (protectedRoutes.includes(routeName)) {
      return !!user;
    }
    
    return true;
  },
  
  /**
   * Check if user can navigate to an auth route
   * @param {Object} user - Current user object
   * @param {string} routeName - Route name to navigate to
   * @returns {boolean} - Whether navigation is allowed
   */
  canNavigateToAuthRoute: (user, routeName) => {
    const authRoutes = [
      ROUTES.AUTH.LOGIN,
      ROUTES.AUTH.SIGNUP,
      ROUTES.AUTH.FORGOT_PASSWORD,
    ];
    
    if (authRoutes.includes(routeName)) {
      return !user; // Can only access auth routes when not logged in
    }
    
    return true;
  },
};

/**
 * Navigation Helpers
 * 
 * Utility functions for navigation operations
 */
export const NavigationHelpers = {
  /**
   * Reset navigation stack to prevent going back
   * Useful after logout or critical actions
   * @param {Object} navigation - Navigation object
   * @param {string} routeName - Route to reset to
   */
  resetToRoute: (navigation, routeName) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  },
  
  /**
   * Navigate and prevent going back
   * @param {Object} navigation - Navigation object
   * @param {string} routeName - Route to navigate to
   * @param {Object} params - Navigation parameters
   */
  navigateAndReset: (navigation, routeName, params = {}) => {
    navigation.navigate(routeName, params);
    // Prevent back navigation by replacing current route
    navigation.replace(routeName, params);
  },
};

export default {
  ROUTES,
  DEEP_LINKING_CONFIG,
  NavigationGuards,
  NavigationHelpers,
};
