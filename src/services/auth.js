/**
 * Firebase Authentication Service
 * 
 * This service provides authentication functions for user management.
 * Currently returns mock data, but structured to easily swap with real Firebase Auth calls.
 * 
 * To switch to real Firebase Auth:
 * 1. Import auth from './firebase'
 * 2. Replace mock returns with actual Firebase Auth API calls
 * 3. Update error handling to use Firebase error codes
 */

import { MOCK_USER } from '../utils/mockData';

// Uncomment when ready to use real Firebase Auth:
// import { auth } from './firebase';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   sendPasswordResetEmail,
//   updateProfile,
//   onAuthStateChanged,
// } from 'firebase/auth';

// Mock auth state management
// In real Firebase, this is handled automatically
let currentUser = null;
const authStateListeners = new Set();

// Mock user storage - stores registered users for login validation
// In real Firebase, this is handled by Firebase Auth
// Format: Map<email, { password, user }>
const mockUserStorage = new Map();

/**
 * Notify all auth state listeners of a state change
 * @param {Object|null} user - Current user or null
 */
const notifyAuthStateListeners = (user) => {
  currentUser = user;
  authStateListeners.forEach((callback) => {
    try {
      callback(user);
    } catch (error) {
      console.error('Error in auth state listener:', error);
    }
  });
};

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
    // TODO: Replace with real Firebase Auth call
    // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // await updateProfile(userCredential.user, { displayName });
    // return { user: userCredential.user, error: null };

    // Mock implementation
    if (!email || !password) {
      throw { code: 'auth/invalid-email', message: 'Email and password are required' };
    }
    // Password validation - must match frontend requirements
    if (password.length < 8) {
      throw { code: 'auth/weak-password', message: 'Password must be at least 8 characters' };
    }
    if (!/\d/.test(password)) {
      throw { code: 'auth/weak-password', message: 'Password must include at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw { code: 'auth/weak-password', message: 'Password must include at least one special character' };
    }

    // Check if email is already registered
    if (mockUserStorage.has(email.toLowerCase())) {
      throw { code: 'auth/email-already-in-use', message: 'This email is already registered' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = {
      ...MOCK_USER,
      email,
      displayName: displayName || email.split('@')[0],
      uid: `mock-user-${Date.now()}`,
    };

    // Store user credentials for login validation
    mockUserStorage.set(email.toLowerCase(), {
      password, // Store password for mock login validation
      user: mockUser,
    });

    // Update auth state and notify listeners
    notifyAuthStateListeners(mockUser);

    return { user: mockUser, error: null };
  } catch (error) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password must be at least 8 characters with a number and special character',
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
    // TODO: Replace with real Firebase Auth call
    // const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // return { user: userCredential.user, error: null };

    // Mock implementation
    if (!email || !password) {
      throw { code: 'auth/invalid-email', message: 'Email and password are required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock validation - check against stored users from signup
    const emailLower = email.toLowerCase();
    const storedUser = mockUserStorage.get(emailLower);
    
    if (storedUser && storedUser.password === password) {
      // Valid credentials - update auth state and notify listeners
      notifyAuthStateListeners(storedUser.user);
      return { user: storedUser.user, error: null };
    }

    // Also support legacy test credentials for backward compatibility
    // NOTE: Password must satisfy signup requirements: min 8 chars, number, and special character
    if (email === 'test@example.com' && password === 'Test@123') {
      const user = { ...MOCK_USER, email };
      // Update auth state and notify listeners
      notifyAuthStateListeners(user);
      return { user, error: null };
    }

    throw { code: 'auth/user-not-found', message: 'Invalid email or password' };
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
    // TODO: Replace with real Firebase Auth call
    // await signOut(auth);
    // return { error: null };

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Clear auth state and notify listeners
    notifyAuthStateListeners(null);
    
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
    // TODO: Replace with real Firebase Auth call
    // await sendPasswordResetEmail(auth, email);
    // return { error: null };

    // Mock implementation
    if (!email) {
      throw { code: 'auth/invalid-email', message: 'Email is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

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
  // TODO: Replace with real Firebase Auth call
  // return auth.currentUser;

  // Mock implementation - return stored current user
  return currentUser;
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
    // TODO: Replace with real Firebase Auth call
    // const user = auth.currentUser;
    // if (!user) {
    //   throw { code: 'auth/no-current-user', message: 'No user is currently signed in' };
    // }
    // await updateProfile(user, { displayName, photoURL });
    // return { user: { ...user, displayName, photoURL }, error: null };

    // Mock implementation
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw { code: 'auth/no-current-user', message: 'No user is currently signed in' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const updatedUser = {
      ...currentUser,
      ...(displayName && { displayName }),
      ...(photoURL && { photoURL }),
    };

    // Update auth state and notify listeners so AuthContext receives the updated user
    notifyAuthStateListeners(updatedUser);

    return { user: updatedUser, error: null };
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
  // TODO: Replace with real Firebase Auth observer
  // return onAuthStateChanged(auth, callback);

  // Mock implementation
  // Add callback to listeners
  authStateListeners.add(callback);
  
  // Immediately call with current user
  callback(getCurrentUser());

  // Return unsubscribe function
  return () => {
    // Remove callback from listeners
    authStateListeners.delete(callback);
    console.log('Auth state listener unsubscribed');
  };
};
