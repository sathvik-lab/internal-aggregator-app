/**
 * Error Handling Utility
 * 
 * Comprehensive error handling utilities for network errors, timeouts,
 * invalid data, and user-friendly error messages.
 */

import { ERROR_MESSAGES } from '../constants/constants';

/**
 * Check if device has network connectivity
 * Uses a lightweight fetch to a reliable endpoint
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const checkNetworkConnection = async () => {
  try {
    // Use a lightweight check - try to fetch a small resource with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // If it's an abort (timeout), assume no connection
      if (fetchError.name === 'AbortError') {
        return false;
      }
      // Other errors might still indicate network issues
      return false;
    }
  } catch (error) {
    console.error('Error checking network connection:', error);
    // On error, assume no connection to be safe
    return false;
  }
};

/**
 * Create a timeout promise that rejects after specified milliseconds
 * @param {number} ms - Milliseconds to wait before timeout
 * @param {string} message - Error message for timeout
 * @returns {Promise} Promise that rejects after timeout
 */
export const createTimeout = (ms, message = 'Request timed out') => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
};

/**
 * Execute an async function with timeout
 * @param {Promise} promise - Promise to execute
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {string} timeoutMessage - Custom timeout message
 * @returns {Promise} Promise that resolves/rejects with timeout handling
 */
export const withTimeout = async (promise, timeoutMs = 30000, timeoutMessage = 'Request timed out. Please try again.') => {
  try {
    return await Promise.race([
      promise,
      createTimeout(timeoutMs, timeoutMessage),
    ]);
  } catch (error) {
    if (error.message === timeoutMessage) {
      throw {
        code: 'timeout',
        message: timeoutMessage,
      };
    }
    throw error;
  }
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  const networkErrorCodes = [
    'network-error',
    'network-request-failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
    'unavailable',
  ];
  
  const networkErrorMessages = [
    'network',
    'connection',
    'internet',
    'offline',
    'fetch failed',
    'network request failed',
  ];
  
  const errorCode = error.code || '';
  const errorMessage = (error.message || '').toLowerCase();
  
  return (
    networkErrorCodes.some(code => errorCode.toLowerCase().includes(code.toLowerCase())) ||
    networkErrorMessages.some(msg => errorMessage.includes(msg))
  );
};

/**
 * Check if error is a timeout error
 * @param {Error} error - Error object to check
 * @returns {boolean} True if timeout error
 */
export const isTimeoutError = (error) => {
  if (!error) return false;
  return error.code === 'timeout' || 
         (error.message && error.message.toLowerCase().includes('timeout')) ||
         (error.code && error.code.toLowerCase().includes('timeout'));
};

/**
 * Check if error is a permission/authorization error
 * @param {Error} error - Error object to check
 * @returns {boolean} True if permission error
 */
export const isPermissionError = (error) => {
  if (!error) return false;
  
  const permissionCodes = [
    'permission-denied',
    'unauthorized',
    'auth/unauthorized',
    'storage/unauthorized',
    'permission_denied',
  ];
  
  return permissionCodes.some(code => 
    (error.code || '').toLowerCase().includes(code.toLowerCase())
  );
};

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object
 * @param {string} defaultMessage - Default message if error can't be mapped
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = ERROR_MESSAGES.GENERIC_ERROR) => {
  if (!error) return defaultMessage;
  
  // If error already has a user-friendly message, use it
  if (error.message && typeof error.message === 'string') {
    // Check if it's already user-friendly (not a technical error)
    if (!error.message.includes('Error:') && 
        !error.message.includes('at ') &&
        !error.message.includes('TypeError') &&
        !error.message.includes('ReferenceError')) {
      return error.message;
    }
  }
  
  // Check for network errors
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Check for timeout errors
  if (isTimeoutError(error)) {
    return 'Request timed out. Please check your connection and try again.';
  }
  
  // Check for permission errors
  if (isPermissionError(error)) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }
  
  // Map Firebase error codes
  // We genericize user-not-found and wrong-password to prevent account enumeration
  const firebaseErrorMap = {
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': ERROR_MESSAGES.NETWORK_ERROR,
    'storage/object-not-found': 'File not found',
    'storage/unauthorized': ERROR_MESSAGES.PERMISSION_DENIED,
    'storage/file-too-large': ERROR_MESSAGES.FILE_TOO_LARGE,
    'storage/invalid-file-type': ERROR_MESSAGES.INVALID_FILE_TYPE,
    'permission-denied': ERROR_MESSAGES.PERMISSION_DENIED,
    'unavailable': ERROR_MESSAGES.NETWORK_ERROR,
    'deadline-exceeded': 'Request timed out. Please try again.',
    'failed-precondition': 'Operation cannot be completed. Please try again.',
    'aborted': 'Operation was canceled. Please try again.',
    'out-of-range': 'Invalid value provided. Please check your input.',
    'unimplemented': 'This feature is not available yet.',
    'internal': 'An internal error occurred. Please try again later.',
    'unavailable': ERROR_MESSAGES.NETWORK_ERROR,
    'data-loss': 'Data corruption detected. Please try again.',
    'unauthenticated': ERROR_MESSAGES.AUTH_REQUIRED,
  };
  
  const errorCode = error.code || '';
  if (firebaseErrorMap[errorCode]) {
    return firebaseErrorMap[errorCode];
  }
  
  // Return default message
  return defaultMessage;
};

/**
 * Handle async operation with comprehensive error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Options: { timeout, checkNetwork, defaultMessage }
 * @returns {Promise<{data: any, error: null}|{data: null, error: Object}>}
 */
export const handleAsyncOperation = async (asyncFn, options = {}) => {
  const {
    timeout = 30000,
    checkNetwork = true,
    defaultMessage = ERROR_MESSAGES.GENERIC_ERROR,
  } = options;
  
  try {
    // Check network connection if requested
    if (checkNetwork) {
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        return {
          data: null,
          error: {
            code: 'network-error',
            message: ERROR_MESSAGES.NETWORK_ERROR,
          },
        };
      }
    }
    
    // Execute with timeout
    const result = await withTimeout(asyncFn(), timeout);
    return { data: result, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: error.code || 'unknown-error',
        message: getErrorMessage(error, defaultMessage),
        originalError: error,
      },
    };
  }
};

/**
 * Validate data structure
 * @param {*} data - Data to validate
 * @param {Object} schema - Validation schema: { required: [], type: {} }
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateData = (data, schema) => {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid data structure'] };
  }
  
  // Check required fields
  if (schema.required) {
    schema.required.forEach(field => {
      if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
        errors.push(`${field} is required`);
      }
    });
  }
  
  // Check field types
  if (schema.type) {
    Object.keys(schema.type).forEach(field => {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        const expectedType = schema.type[field];
        const actualType = typeof data[field];
        
        if (expectedType === 'array' && !Array.isArray(data[field])) {
          errors.push(`${field} must be an array`);
        } else if (expectedType === 'object' && (actualType !== 'object' || Array.isArray(data[field]))) {
          errors.push(`${field} must be an object`);
        } else if (expectedType !== 'array' && expectedType !== 'object' && actualType !== expectedType) {
          errors.push(`${field} must be of type ${expectedType}`);
        }
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Safe value getter with null/undefined checks
 * @param {Function} getter - Function that returns a value
 * @param {*} defaultValue - Default value if getter throws or returns null/undefined
 * @returns {*} Safe value
 */
export const safeGet = (getter, defaultValue = null) => {
  try {
    const value = getter();
    return value !== null && value !== undefined ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safe async value getter
 * @param {Function} asyncGetter - Async function that returns a value
 * @param {*} defaultValue - Default value if getter throws or returns null/undefined
 * @returns {Promise<*>} Safe value
 */
export const safeGetAsync = async (asyncGetter, defaultValue = null) => {
  try {
    const value = await asyncGetter();
    return value !== null && value !== undefined ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} asyncFn - Async function to retry
 * @param {Object} options - Options: { maxRetries, initialDelay, maxDelay, backoffMultiplier }
 * @returns {Promise} Result of async function
 */
export const retryAsyncOperation = async (asyncFn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (isPermissionError(error) || 
          (error.code && error.code.includes('invalid-argument'))) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
