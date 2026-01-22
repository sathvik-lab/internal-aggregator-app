/**
 * Firebase Authentication Service
 * 
 * This service provides authentication functions for user management using Firebase Auth.
 */

import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';

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
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled',
    };

    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: errorMessages[error.code] || error.message || 'An error occurred during sign up',
      },
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    };

    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: errorMessages[error.code] || error.message || 'An error occurred during sign in',
      },
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
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return {
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'An error occurred during sign out',
      },
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
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email',
      'auth/invalid-email': 'Invalid email address',
    };

    return {
      error: {
        code: error.code || 'auth/unknown-error',
        message: errorMessages[error.code] || error.message || 'An error occurred sending reset email',
      },
    };
  }
};

/**
 * Get the currently authenticated user
 * @returns {Object|null} Current user object or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
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
    const user = auth.currentUser;
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
        ...user, 
        displayName: user.displayName, 
        photoURL: user.photoURL 
      }, 
      error: null 
    };
  } catch (error) {
    return {
      user: null,
      error: {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'An error occurred updating profile',
      },
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
  return firebaseOnAuthStateChanged(auth, callback);
};
