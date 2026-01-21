/**
 * Authentication Context
 * 
 * Provides global authentication state and functions to all components.
 * Manages Firebase Authentication state observer and user session.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
// Import auth service functions
// These will be available once auth.js is created in /src/services/auth.js
import { onAuthStateChanged, signOutUser } from '../services/auth';

/**
 * AuthContext - Provides auth state and functions
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
});

/**
 * AuthProvider Component
 * 
 * Wraps the app and provides authentication state to all children.
 * Sets up Firebase Auth state observer and manages user session.
 * 
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up Firebase Auth state observer
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await signOutUser();
      
      if (result.error) {
        console.error('Sign out error:', result.error);
        // Still clear user state even if there's an error
        setUser(null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Throws error if used outside AuthProvider.
 * 
 * @returns {Object} Auth context value with user, loading, and signOut
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
