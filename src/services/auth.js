/**
 * Firebase Authentication Service
 * 
 * This service provides authentication functions for user management using Firebase Auth.
 */

import { getFirebaseAuth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { getErrorMessage } from '../utils/errorHandler';

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this project.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/missing-email': 'Email is required.',
  'auth/no-current-user': 'You must be signed in to continue.',
};

const formatAuthError = (error, defaultMessage) => ({
  code: error?.code || 'auth/unknown-error',
  message:
    AUTH_ERROR_MESSAGES[error?.code] ||
    getErrorMessage(error, defaultMessage),
});

/**
 * Sign up a new user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password (min 6 characters)
 * @param {string} displayName - User's display name
 * @returns {Promise<{user: Object, error: null}>} User object on success
 * @throws {Error} Error object with code and message on failure
 */
export const signUpUser = async (email, password, displayName) => {
  try {
    // Get the actual auth instance (not a Proxy) for Firebase SDK functions
    const authInstance = getFirebaseAuth();
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    
    // Update profile with display name if provided
    let profileError = null;
    if (displayName) {
      try {
        await updateProfile(userCredential.user, { displayName });
      } catch (error) {
        profileError = formatAuthError(error, 'Account created but profile details could not be saved.');
      }
    }
    
    return { user: userCredential.user, profileError, error: null };
  } catch (error) {
    return {
      user: null,
      error: formatAuthError(error, 'Unable to create your account right now. Please try again.'),
    };
  }
};

/**
 * Sign in an existing user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<{user: Object, error: null}>} User object on success
 * @throws {Error} Error object with code and message on failure
 */
export const signInUser = async (email, password) => {
  try {
    // Get the actual auth instance (not a Proxy) for Firebase SDK functions
    const authInstance = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: formatAuthError(error, 'Unable to sign in right now. Please try again.'),
    };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const signOutUser = async () => {
  try {
    // Get the actual auth instance (not a Proxy) for Firebase SDK functions
    const authInstance = getFirebaseAuth();
    await signOut(authInstance);
    return { error: null };
  } catch (error) {
    return {
      error: formatAuthError(error, 'Unable to sign out right now. Please try again.'),
    };
  }
};

/**
 * Send password reset email to user
 * @param {string} email - User email address
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const resetPassword = async (email) => {
  try {
    // Get the actual auth instance (not a Proxy) for Firebase SDK functions
    const authInstance = getFirebaseAuth();
    await sendPasswordResetEmail(authInstance, email);
    return { error: null };
  } catch (error) {
    // Map Firebase error codes to user-friendly messages
    // Genericize error: if user not found, return success to prevent account enumeration
    if (error.code === 'auth/user-not-found') {
      return { error: null };
    }

    return {
      error: formatAuthError(error, 'Unable to send a password reset email right now. Please try again.'),
    };
  }
};

/**
 * Get the currently authenticated user
 * @returns {Object|null} Current user object or null if not authenticated
 */
export const getCurrentUser = () => {
  // Get the actual auth instance to access currentUser
  const authInstance = getFirebaseAuth();
  return authInstance.currentUser;
};

/**
 * Update user profile information
 * @param {string} displayName - New display name (optional)
 * @param {string} photoURL - New photo URL (optional)
 * @returns {Promise<{user: Object, error: null}>} Updated user object
 * @throws {Error} Error object with code and message on failure
 */
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    // Get the actual auth instance to access currentUser
    const authInstance = getFirebaseAuth();
    const user = authInstance.currentUser;
    if (!user) {
      throw { code: 'auth/no-current-user', message: 'No user is currently signed in' };
    }
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    await updateProfile(user, updateData);
    
    // Return updated user object
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: formatAuthError(error, 'Unable to update your profile right now. Please try again.'),
    };
  }
};

/**
 * Set up an auth state observer
 * This function should be called in your root component to track authentication state changes
 * @param {Function} callback - Callback function that receives the user object (or null)
 * @returns {Function} Unsubscribe function to stop listening
 */
export const onAuthStateChanged = (callback) => {
  // Get the actual auth instance (not a Proxy) for Firebase SDK functions
  const authInstance = getFirebaseAuth();
  return firebaseOnAuthStateChanged(authInstance, callback);
};
