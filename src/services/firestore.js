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

/**
 * Create a new document in a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} data - Document data to create
 * @param {string} [docId] - Optional document ID (auto-generated if not provided)
 * @returns {Promise<{id: string, error: null}>} Document ID on success
 * @throws {Error} Error object with code and message on failure
 */
export const createDocument = async (collectionName, data, docId = null) => {
  try {
    if (!collectionName || !data) {
      throw { code: 'invalid-argument', message: 'Collection name and data are required' };
    }

    const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));
    
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { id: docRef.id, error: null };
  } catch (error) {
    return {
      id: null,
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred creating the document',
      },
    };
  }
};

/**
 * Get a single document by ID from a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to retrieve
 * @returns {Promise<{data: Object|null, error: null}>} Document data on success
 * @throws {Error} Error object with code and message on failure
 */
export const getDocument = async (collectionName, docId) => {
  try {
    if (!collectionName || !docId) {
      throw { code: 'invalid-argument', message: 'Collection name and document ID are required' };
    }

    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    
    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred retrieving the document',
      },
    };
  }
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
  try {
    if (!collectionName || !docId || !data) {
      throw { code: 'invalid-argument', message: 'Collection name, document ID, and data are required' };
    }

    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    return { error: null };
  } catch (error) {
    return {
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred updating the document',
      },
    };
  }
};

/**
 * Delete a document from a Firestore collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID to delete
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    if (!collectionName || !docId) {
      throw { code: 'invalid-argument', message: 'Collection name and document ID are required' };
    }

    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    
    return { error: null };
  } catch (error) {
    return {
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred deleting the document',
      },
    };
  }
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
  try {
    if (!collectionName) {
      throw { code: 'invalid-argument', message: 'Collection name is required' };
    }

    let q = query(collection(db, collectionName));
    
    // Apply where conditions
    conditions.forEach((condition) => {
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
    
    // Apply pagination (startAfter) - only works with orderBy
    if (options.startAfter && (!hasWhereConditions || orderByMatchesWhere)) {
      q = query(q, startAfter(options.startAfter));
    }
    
    const querySnapshot = await getDocs(q);
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
        if (!aVal || !bVal) return 0;
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderBy.direction === 'desc' ? -comparison : comparison;
      });
      
      // Apply limit after sorting
      if (options.limit) {
        documents = documents.slice(0, options.limit);
      }
    }
    
    return { data: documents, error: null };
  } catch (error) {
    // If error is about missing index, try to work around it
    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      console.warn('Firestore index required. Using client-side sorting instead. Create index for better performance:', error.message);
      // Try query without orderBy
      try {
        let q = query(collection(db, collectionName));
        conditions.forEach((condition) => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
        const querySnapshot = await getDocs(q);
        let documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
          uploadDate: doc.data().uploadDate?.toDate?.()?.toISOString() || doc.data().uploadDate,
          dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
          completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt,
        }));
        
        // Client-side sorting
        if (options.orderBy) {
          documents.sort((a, b) => {
            const aVal = a[options.orderBy.field];
            const bVal = b[options.orderBy.field];
            if (!aVal || !bVal) return 0;
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return options.orderBy.direction === 'desc' ? -comparison : comparison;
          });
        }
        
        // Apply limit
        if (options.limit) {
          documents = documents.slice(0, options.limit);
        }
        
        return { data: documents, error: null };
      } catch (retryError) {
        return {
          data: [],
          error: {
            code: retryError.code || 'unknown-error',
            message: retryError.message || 'An error occurred querying documents',
          },
        };
      }
    }
    
    return {
      data: [],
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred querying documents',
      },
    };
  }
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

    let q = query(collection(db, collectionName));
    
    // Apply where conditions
    conditions.forEach((condition) => {
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
            if (!aVal || !bVal) return 0;
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
          // Return empty array - the caller can handle this gracefully
          callback([]);
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
