/**
 * Authentication Context
 * 
 * Provides global authentication state and functions to all components.
 * Manages Firebase Authentication state observer and user session.
 */

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
// Import auth service functions
// These will be available once auth.js is created in /src/services/auth.js
import { onAuthStateChanged, signOutUser } from '../services/auth';
import { syncTemplates, clearTemplateCache } from '../services/checklistTemplateSync';
import { syncInstances, clearInstanceCache } from '../services/checklistInstanceSync';

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
    let unsubscribe = null;
    let retryTimeout = null;
    let retryCount = 0;
    const maxRetries = 15; // Try up to 15 times
    const initialDelay = 500; // Wait 500ms before first attempt (gives Firebase time to register components)
    const baseRetryDelay = 500; // Base delay of 500ms, will increase with exponential backoff

    // Function to set up the auth observer with retry logic
    const setupAuthObserver = () => {
      try {
        // Try to set up Firebase Auth state observer
        unsubscribe = onAuthStateChanged((currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        // Success - no need to retry
        console.log('✅ Firebase Auth observer set up successfully');
        return;
      } catch (error) {
        // If auth component isn't ready yet, retry after a delay
        if (
          error.message?.includes('not ready yet') ||
          error.message?.includes('has not been registered') ||
          error.message?.includes('component has not been registered')
        ) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Exponential backoff: delay increases with each retry (500ms, 1000ms, 2000ms, etc.)
            const delay = baseRetryDelay * Math.pow(2, Math.min(retryCount - 1, 3)); // Cap at 4 seconds
            console.log(`⚠️  Auth not ready, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})...`);
            retryTimeout = setTimeout(() => {
              setupAuthObserver();
            }, delay);
          } else {
            // Max retries reached - set loading to false and show error
            console.error('❌ Failed to initialize Firebase Auth after multiple retries');
            console.error('This is a known issue with Firebase JS SDK in React Native.');
            console.error('The app will continue, but authentication features may not work.');
            console.error('If this persists, try: npx expo start --clear');
            setLoading(false);
            // Don't throw - allow app to continue (user will see login screen)
          }
        } else {
          // Other errors - don't retry, just fail
          console.error('Failed to set up auth observer:', error);
          setLoading(false);
        }
      }
    };

    // Start setting up the observer after initial delay
    // This gives Firebase time to register all components after app initialization
    retryTimeout = setTimeout(() => {
      setupAuthObserver();
    }, initialDelay);

    // Cleanup listener and timeout on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Sync templates and instances when user logs in
   */
  const lastSyncedUid = useRef(null);
  
  useEffect(() => {
    const uid = user?.uid;
    
    // Skip if no user, still loading, or already synced for this UID
    if (!uid || loading || uid === lastSyncedUid.current) {
      return;
    }
    
    // Track that we're syncing for this UID
    lastSyncedUid.current = uid;
    let mounted = true;
    
    // Sync templates and generate instances in background
    syncTemplates(uid)
      .then((result) => {
        // Check if component is still mounted and UID hasn't changed
        if (!mounted || uid !== lastSyncedUid.current) {
          return;
        }
        
        if (!result.error && result.templates && result.templates.length > 0) {
          // Generate instances from templates
          syncInstances(uid, result.templates)
            .then(() => {
              // Only update lastSyncedUid if sync completed successfully and still mounted
              if (mounted && uid === lastSyncedUid.current) {
                // Sync completed successfully
              }
            })
            .catch((error) => {
              if (mounted && uid === lastSyncedUid.current) {
                console.error('Error syncing instances on login:', error);
              }
            });
        }
      })
      .catch((error) => {
        if (mounted && uid === lastSyncedUid.current) {
          console.error('Error syncing templates on login:', error);
          // Reset lastSyncedUid on error so it can retry
          lastSyncedUid.current = null;
        }
      });
    
    // Cleanup: mark as unmounted
    return () => {
      mounted = false;
    };
  }, [user?.uid, loading]);

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear caches before signing out (non-blocking)
      if (user?.uid) {
        // Use Promise.allSettled to ensure sign-out proceeds even if cache clearing fails
        const cacheResults = await Promise.allSettled([
          clearTemplateCache(user.uid).catch((error) => {
            console.error('Error clearing template cache:', error);
            return { error };
          }),
          clearInstanceCache(user.uid).catch((error) => {
            console.error('Error clearing instance cache:', error);
            return { error };
          }),
        ]);
        
        // Log any cache clearing failures but don't block sign-out
        cacheResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Cache clear ${index === 0 ? 'template' : 'instance'} failed:`, result.reason);
          }
        });
      }
      
      // Always proceed with sign-out regardless of cache clearing results
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
