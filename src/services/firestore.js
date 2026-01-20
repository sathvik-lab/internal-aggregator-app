/**
 * Firebase Firestore Service
 * 
 * This service provides CRUD operations for Firestore database.
 * Currently returns mock data, but structured to easily swap with real Firestore calls.
 * 
 * To switch to real Firestore:
 * 1. Import db from './firebase'
 * 2. Import Firestore functions: collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, etc.
 * 3. Replace mock returns with actual Firestore API calls
 * 4. Update error handling to use Firestore error codes
 */

import {
  MOCK_DOCUMENTS,
  MOCK_CHECKLIST_ITEMS,
  getMockDocumentById,
  getMockChecklistItemsByUserId,
  getMockDocumentsByUserId,
} from '../utils/mockData';

// Uncomment when ready to use real Firestore:
// import { db } from './firebase';
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   setDoc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   limit,
//   onSnapshot,
//   Timestamp,
//   serverTimestamp,
// } from 'firebase/firestore';

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
    // TODO: Replace with real Firestore call
    // const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));
    // await setDoc(docRef, {
    //   ...data,
    //   createdAt: serverTimestamp(),
    //   updatedAt: serverTimestamp(),
    // });
    // return { id: docRef.id, error: null };

    // Mock implementation
    if (!collectionName || !data) {
      throw { code: 'invalid-argument', message: 'Collection name and data are required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newDocId = docId || `doc-${Date.now()}`;
    const newDoc = {
      id: newDocId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In mock mode, we could store this in memory, but for now just return success
    return { id: newDocId, error: null };
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
    // TODO: Replace with real Firestore call
    // const docRef = doc(db, collectionName, docId);
    // const docSnap = await getDoc(docRef);
    // if (docSnap.exists()) {
    //   return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    // }
    // return { data: null, error: null };

    // Mock implementation
    if (!collectionName || !docId) {
      throw { code: 'invalid-argument', message: 'Collection name and document ID are required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Return mock data based on collection name
    let mockData = null;
    if (collectionName === 'documents') {
      mockData = getMockDocumentById(docId);
    } else if (collectionName === 'checklistItems') {
      mockData = getMockChecklistItemsByUserId('mock-user-123').find((item) => item.id === docId);
    }

    return { data: mockData, error: null };
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
    // TODO: Replace with real Firestore call
    // const docRef = doc(db, collectionName, docId);
    // await updateDoc(docRef, {
    //   ...data,
    //   updatedAt: serverTimestamp(),
    // });
    // return { error: null };

    // Mock implementation
    if (!collectionName || !docId || !data) {
      throw { code: 'invalid-argument', message: 'Collection name, document ID, and data are required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

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
    // TODO: Replace with real Firestore call
    // const docRef = doc(db, collectionName, docId);
    // await deleteDoc(docRef);
    // return { error: null };

    // Mock implementation
    if (!collectionName || !docId) {
      throw { code: 'invalid-argument', message: 'Collection name and document ID are required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

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
    // TODO: Replace with real Firestore call
    // let q = collection(db, collectionName);
    // conditions.forEach((condition) => {
    //   q = query(q, where(condition.field, condition.operator, condition.value));
    // });
    // if (options.orderBy) {
    //   q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    // }
    // if (options.limit) {
    //   q = query(q, limit(options.limit));
    // }
    // const querySnapshot = await getDocs(q);
    // const documents = querySnapshot.docs.map((doc) => ({
    //   id: doc.id,
    //   ...doc.data(),
    // }));
    // return { data: documents, error: null };

    // Mock implementation
    if (!collectionName) {
      throw { code: 'invalid-argument', message: 'Collection name is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

    let mockData = [];
    if (collectionName === 'documents') {
      mockData = [...MOCK_DOCUMENTS];
    } else if (collectionName === 'checklistItems') {
      mockData = [...MOCK_CHECKLIST_ITEMS];
    }

    // Apply conditions (mock filtering)
    conditions.forEach((condition) => {
      const { field, operator, value } = condition;
      mockData = mockData.filter((doc) => {
        switch (operator) {
          case '==':
            return doc[field] === value;
          case '!=':
            return doc[field] !== value;
          case '>':
            return doc[field] > value;
          case '>=':
            return doc[field] >= value;
          case '<':
            return doc[field] < value;
          case '<=':
            return doc[field] <= value;
          case 'array-contains':
            return Array.isArray(doc[field]) && doc[field].includes(value);
          default:
            return true;
        }
      });
    });

    // Apply ordering
    if (options.orderBy) {
      const { field, direction = 'asc' } = options.orderBy;
      mockData.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (direction === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    }

    // Apply limit
    if (options.limit) {
      mockData = mockData.slice(0, options.limit);
    }

    return { data: mockData, error: null };
  } catch (error) {
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
 * @param {Function} callback - Callback function that receives the documents array
 * @param {Object} [options] - Query options: { orderBy, limit }
 * @returns {Function} Unsubscribe function to stop listening
 */
export const setupRealtimeListener = (collectionName, conditions = [], callback, options = {}) => {
  try {
    // TODO: Replace with real Firestore listener
    // let q = collection(db, collectionName);
    // conditions.forEach((condition) => {
    //   q = query(q, where(condition.field, condition.operator, condition.value));
    // });
    // if (options.orderBy) {
    //   q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    // }
    // if (options.limit) {
    //   q = query(q, limit(options.limit));
    // }
    // const unsubscribe = onSnapshot(
    //   q,
    //   (querySnapshot) => {
    //     const documents = querySnapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));
    //     callback(documents);
    //   },
    //   (error) => {
    //     console.error('Firestore listener error:', error);
    //     callback([], error);
    //   }
    // );
    // return unsubscribe;

    // Mock implementation
    if (!collectionName || !callback) {
      throw { code: 'invalid-argument', message: 'Collection name and callback are required' };
    }

    // Immediately call callback with mock data
    queryDocuments(collectionName, conditions, options).then((result) => {
      callback(result.data, result.error);
    });

    // Return unsubscribe function
    return () => {
      // Mock unsubscribe - in real implementation, this would stop the Firestore listener
      console.log(`Realtime listener unsubscribed for collection: ${collectionName}`);
    };
  } catch (error) {
    console.error('Error setting up realtime listener:', error);
    callback([], error);
    return () => {}; // Return no-op unsubscribe function
  }
};
