/**
 * Firebase Firestore Service
 * 
 * This service provides CRUD operations for Firestore database.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { handleAsyncOperation, getErrorMessage, isNetworkError } from '../utils/errorHandler';

/**
 * Create a new document in a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} data - Document data to create
 * @param {string} [docId] - Optional document ID (auto-generated if not provided)
 * @returns {Promise<{id: string, error: null}>} Document ID on success
 * @throws {Error} Error object with code and message on failure
 */
export const createDocument = async (collectionName, data, docId = null) => {
  // Validate inputs
  if (!collectionName || typeof collectionName !== 'string') {
    return {
      id: null,
      error: {
        code: 'invalid-argument',
        message: 'Collection name is required and must be a string',
      },
    };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      id: null,
      error: {
        code: 'invalid-argument',
        message: 'Data is required and must be an object',
      },
    };
  }

  // Check if db is available
  if (!db) {
    return {
      id: null,
      error: {
        code: 'unavailable',
        message: 'Database is not available. Please check your connection.',
      },
    };
  }

  return handleAsyncOperation(
    async () => {
      const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));
      
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    },
    {
      timeout: 30000,
      checkNetwork: true,
      defaultMessage: 'An error occurred creating the document',
    }
  ).then(result => {
    if (result.error) {
      return {
        id: null,
        error: {
          code: result.error.code,
          message: getErrorMessage(result.error, 'An error occurred creating the document'),
        },
      };
    }
    return { id: result.data, error: null };
  });
};

/**
 * Get a single document by ID from a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to retrieve
 * @returns {Promise<{data: Object|null, error: null}>} Document data on success
 * @throws {Error} Error object with code and message on failure
 */
export const getDocument = async (collectionName, docId) => {
  // Validate inputs
  if (!collectionName || typeof collectionName !== 'string') {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'Collection name is required and must be a string',
      },
    };
  }

  if (!docId || typeof docId !== 'string') {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'Document ID is required and must be a string',
      },
    };
  }

  // Check if db is available
  if (!db) {
    return {
      data: null,
      error: {
        code: 'unavailable',
        message: 'Database is not available. Please check your connection.',
      },
    };
  }

  return handleAsyncOperation(
    async () => {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          ...docData,
          // Convert Firestore Timestamps to ISO strings
          createdAt: docData.createdAt?.toDate?.()?.toISOString() || docData.createdAt,
          updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || docData.updatedAt,
          uploadDate: docData.uploadDate?.toDate?.()?.toISOString() || docData.uploadDate,
          dueDate: docData.dueDate?.toDate?.()?.toISOString() || docData.dueDate,
          completedAt: docData.completedAt?.toDate?.()?.toISOString() || docData.completedAt,
        };
      }
      
      return null;
    },
    {
      timeout: 30000,
      checkNetwork: true,
      defaultMessage: 'An error occurred retrieving the document',
    }
  ).then(result => {
    if (result.error) {
      return {
        data: null,
        error: {
          code: result.error.code,
          message: getErrorMessage(result.error, 'An error occurred retrieving the document'),
        },
      };
    }
    return { data: result.data, error: null };
  });
};

/**
 * Update an existing document in a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to update
 * @param {Object} data - Partial data to update
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const updateDocument = async (collectionName, docId, data) => {
  // Validate inputs
  if (!collectionName || typeof collectionName !== 'string') {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Collection name is required and must be a string',
      },
    };
  }

  if (!docId || typeof docId !== 'string') {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Document ID is required and must be a string',
      },
    };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Data is required and must be an object',
      },
    };
  }

  // Check if db is available
  if (!db) {
    return {
      error: {
        code: 'unavailable',
        message: 'Database is not available. Please check your connection.',
      },
    };
  }

  return handleAsyncOperation(
    async () => {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    },
    {
      timeout: 30000,
      checkNetwork: true,
      defaultMessage: 'An error occurred updating the document',
    }
  ).then(result => {
    if (result.error) {
      return {
        error: {
          code: result.error.code,
          message: getErrorMessage(result.error, 'An error occurred updating the document'),
        },
      };
    }
    return { error: null };
  });
};

/**
 * Delete a document from a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to delete
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const deleteDocument = async (collectionName, docId) => {
  // Validate inputs
  if (!collectionName || typeof collectionName !== 'string') {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Collection name is required and must be a string',
      },
    };
  }

  if (!docId || typeof docId !== 'string') {
    return {
      error: {
        code: 'invalid-argument',
        message: 'Document ID is required and must be a string',
      },
    };
  }

  // Check if db is available
  if (!db) {
    return {
      error: {
        code: 'unavailable',
        message: 'Database is not available. Please check your connection.',
      },
    };
  }

  return handleAsyncOperation(
    async () => {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    },
    {
      timeout: 30000,
      checkNetwork: true,
      defaultMessage: 'An error occurred deleting the document',
    }
  ).then(result => {
    if (result.error) {
      return {
        error: {
          code: result.error.code,
          message: getErrorMessage(result.error, 'An error occurred deleting the document'),
        },
      };
    }
    return { error: null };
  });
};

/**
 * Query documents from a Firestore collection with optional conditions
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Array<Object>} [conditions] - Array of condition objects: { field, operator, value }
 *   Example: [{ field: 'userId', operator: '==', value: 'user123' }]
 * @param {Object} [options] - Query options: { orderBy, limit, startAfter }
 * @returns {Promise<{data: Array, error: null}>} Array of documents on success
 * @throws {Error} Error object with code and message on failure
 */
export const queryDocuments = async (collectionName, conditions = [], options = {}) => {
  // Validate inputs
  if (!collectionName || typeof collectionName !== 'string') {
    return {
      data: [],
      error: {
        code: 'invalid-argument',
        message: 'Collection name is required and must be a string',
      },
    };
  }

  // Validate conditions array
  if (!Array.isArray(conditions)) {
    return {
      data: [],
      error: {
        code: 'invalid-argument',
        message: 'Conditions must be an array',
      },
    };
  }

  // Validate options object
  if (options && (typeof options !== 'object' || Array.isArray(options))) {
    return {
      data: [],
      error: {
        code: 'invalid-argument',
        message: 'Options must be an object',
      },
    };
  }

  // Check if db is available
  if (!db) {
    return {
      data: [],
      error: {
        code: 'unavailable',
        message: 'Database is not available. Please check your connection.',
      },
    };
  }

  return handleAsyncOperation(
    async () => {
      let q = query(collection(db, collectionName));
      
      // Apply where conditions with validation
      conditions.forEach((condition) => {
        if (condition && condition.field && condition.operator && condition.value !== undefined) {
          q = query(q, where(condition.field, condition.operator, condition.value));
        }
      });
      
      // NOTE: When using where() with orderBy() on a different field, Firestore requires a composite index.
      // To avoid index errors, we'll do client-side sorting instead.
      const hasWhereConditions = conditions.length > 0;
      const orderByField = options?.orderBy?.field;
      const orderByMatchesWhere = conditions.some(c => c?.field === orderByField);
      
      // Only apply orderBy if no where conditions or orderBy matches a where condition
      if (options?.orderBy && orderByField && (!hasWhereConditions || orderByMatchesWhere)) {
        q = query(q, orderBy(orderByField, options.orderBy.direction || 'asc'));
      }
      
      // Apply limit (only if orderBy was applied, otherwise we'll limit after sorting)
      if (options?.limit && typeof options.limit === 'number' && options.limit > 0 && (!hasWhereConditions || orderByMatchesWhere)) {
        q = query(q, limit(options.limit));
      }
      
      // Apply pagination (startAfter) - only works with orderBy
      if (options?.startAfter && hasWhereConditions && !orderByMatchesWhere) {
        throw {
          code: 'invalid-argument',
          message: 'startAfter requires server-side ordering; cannot apply with current where/order configuration',
        };
      }
      if (options?.startAfter && (!hasWhereConditions || orderByMatchesWhere)) {
        q = query(q, startAfter(options.startAfter));
      }
      
      const querySnapshot = await getDocs(q);
      let documents = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          // Convert Firestore Timestamps to ISO strings if necessary
          createdAt: docData.createdAt?.toDate?.()?.toISOString() || docData.createdAt || null,
          updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || docData.updatedAt || null,
          uploadDate: docData.uploadDate?.toDate?.()?.toISOString() || docData.uploadDate || null,
          dueDate: docData.dueDate?.toDate?.()?.toISOString() || docData.dueDate || null,
          completedAt: docData.completedAt?.toDate?.()?.toISOString() || docData.completedAt || null,
        };
      });
      
      // Client-side sorting if orderBy was requested but couldn't be applied in query
      if (options?.orderBy && orderByField && hasWhereConditions && !orderByMatchesWhere) {
        documents.sort((a, b) => {
          const aVal = a[orderByField];
          const bVal = b[orderByField];
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return options.orderBy.direction === 'desc' ? -comparison : comparison;
        });
        
        // Apply limit after sorting
        if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
          documents = documents.slice(0, options.limit);
        }
      }
      
      return documents;
    },
    {
      timeout: 30000,
      checkNetwork: true,
      defaultMessage: 'An error occurred querying documents',
    }
  ).then(result => {
    if (result.error) {
      // If error is about missing index, provide helpful message
      if (result.error.code === 'failed-precondition' && result.error.message?.includes('index')) {
        console.warn('Firestore index required. Using client-side sorting instead. Create index for better performance.');
        return {
          data: [],
          error: {
            code: 'failed-precondition',
            message: 'Index required. Please create the required Firestore index for better performance.',
          },
        };
      }
      
      return {
        data: [],
        error: {
          code: result.error.code,
          message: getErrorMessage(result.error, 'An error occurred querying documents'),
        },
      };
    }
    return { data: result.data || [], error: null };
  });
};

/**
 * Set up a real-time listener for a Firestore collection query
 * This function subscribes to changes and calls the callback whenever data changes
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Array<Object>} [conditions] - Array of condition objects: { field, operator, value }
 * @param {Function} callback - Callback function with signature:
 *   - Success: callback(documents) - receives array of documents
 *   - Error: callback([], error) - receives empty array and error object
 * @param {Object} [options] - Query options: { orderBy, limit }
 * @returns {Function} Unsubscribe function to stop listening
 */
export const setupRealtimeListener = (collectionName, conditions = [], callback, options = {}) => {
  try {
    if (!collectionName || !callback) {
      throw { code: 'invalid-argument', message: 'Collection name and callback are required' };
    }
    if (!db) {
      throw { code: 'unavailable', message: 'Database is not available. Please check your connection.' };
    }
    if (!Array.isArray(conditions)) {
      throw { code: 'invalid-argument', message: 'Conditions must be an array' };
    }

    let q = query(collection(db, collectionName));
    
    // Apply where conditions
    conditions.forEach((condition) => {
      if (!condition || typeof condition !== 'object' || !condition.field || !condition.operator || condition.value === undefined) {
        throw { code: 'invalid-argument', message: 'Each condition must include field, operator, and value' };
      }
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    // NOTE: When using where() with orderBy() on a different field, Firestore requires a composite index.
    // To avoid index errors, we'll do client-side sorting instead.
    const hasWhereConditions = conditions.length > 0;
    const orderByField = options.orderBy?.field;
    const orderByMatchesWhere = conditions.some(c => c.field === orderByField);
    
    // Only apply orderBy if no where conditions or orderBy matches a where condition
    if (options.orderBy && (!hasWhereConditions || orderByMatchesWhere)) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    }
    
    // Apply limit (only if orderBy was applied, otherwise we'll limit after sorting)
    if (options.limit && (!hasWhereConditions || orderByMatchesWhere)) {
      q = query(q, limit(options.limit));
    }
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to ISO strings if necessary
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
          uploadDate: doc.data().uploadDate?.toDate?.()?.toISOString() || doc.data().uploadDate,
          dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
          completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt,
        }));
        
        // Client-side sorting if orderBy was requested but couldn't be applied in query
        if (options.orderBy && hasWhereConditions && !orderByMatchesWhere) {
          documents.sort((a, b) => {
            const aVal = a[options.orderBy.field];
            const bVal = b[options.orderBy.field];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return options.orderBy.direction === 'desc' ? -comparison : comparison;
          });
          
          // Apply limit after sorting
          if (options.limit) {
            documents = documents.slice(0, options.limit);
          }
        }
        
        callback(documents);
      },
      (error) => {
        // If error is about missing index, log it but don't fail completely
        if (error.code === 'failed-precondition' && error.message?.includes('index')) {
          console.warn('Firestore index required. Query will work but may be slower. Create index:', error.message);
          callback([], error);
        } else {
          console.error('Firestore listener error:', error);
          callback([], error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up realtime listener:', error);
    callback([], error);
    return () => {}; // Return no-op unsubscribe function
  }
};
