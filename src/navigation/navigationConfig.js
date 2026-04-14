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
    PHONE_LOGIN: 'PhoneLogin',
    SIGNUP: 'Signup',
    FORGOT_PASSWORD: 'ForgotPassword',
  },

  ONBOARDING: {
    OWNER_PROFILE: 'OwnerOnboarding',
  },
  
  // Main Tabs
  MAIN: {
    DASHBOARD: 'Dashboard',
    DOCUMENTS: 'Documents',
    CHECKLIST: 'Checklist',
    PROFILE: 'Profile',
    MEDIA_LOGS: 'MediaLogs',
    INSPECTION_READINESS: 'InspectionReadiness',
    INCIDENTS: 'Incidents',
    MAINTENANCE: 'Maintenance',
  },
  
  // Documents Stack
  DOCUMENTS: {
    LIST: 'DocumentsList',
    DETAIL: 'DocumentDetail',
  },

  // Profile Stack
  PROFILE: {
    MAIN: 'ProfileMain',
    STAFF: 'Staff',
  },

  INCIDENTS: {
    LIST: 'IncidentsList',
    DETAIL: 'IncidentDetail',
  },

  MAINTENANCE: {
    LIST: 'MaintenanceList',
    DETAIL: 'MaintenanceDetail',
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
 * - foodtruckcompliance://documents/123
 * - foodtruckcompliance://checklist/today
 * - foodtruckcompliance://profile
 */
export const DEEP_LINKING_CONFIG = {
  prefixes: ['foodtruckcompliance://', 'https://foodtruckcompliance.app'],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      PhoneLogin: 'phone-login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',
      OwnerOnboarding: 'onboarding',
      
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
      Profile: {
        path: 'profile',
        screens: {
          ProfileMain: '',
          Staff: 'staff',
        },
      },
      MediaLogs: 'logs',
      InspectionReadiness: 'readiness',
      Incidents: {
        path: 'incidents',
        screens: {
          IncidentsList: '',
          IncidentDetail: ':incidentId',
        },
      },
      Maintenance: {
        path: 'maintenance',
        screens: {
          MaintenanceList: '',
          MaintenanceDetail: ':taskId',
        },
      },
      
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
      ROUTES.MAIN.MEDIA_LOGS,
      ROUTES.MAIN.INSPECTION_READINESS,
      ROUTES.MAIN.INCIDENTS,
      ROUTES.MAIN.MAINTENANCE,
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
      ROUTES.AUTH.PHONE_LOGIN,
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
    navigation.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  },
};

export default {
  ROUTES,
  DEEP_LINKING_CONFIG,
  NavigationGuards,
  NavigationHelpers,
};
