/**
 * Firebase Storage Service
 * 
 * This service provides file upload/download operations for Firebase Storage.
 * Currently returns mock data, but structured to easily swap with real Firebase Storage calls.
 * 
 * To switch to real Firebase Storage:
 * 1. Import storage from './firebase'
 * 2. Import Storage functions: ref, uploadBytes, getDownloadURL, deleteObject, getBytes, etc.
 * 3. Replace mock returns with actual Firebase Storage API calls
 * 4. Update error handling to use Storage error codes
 */

import { FILE_LIMITS, STORAGE_PATHS } from '../constants/constants';

// Uncomment when ready to use real Firebase Storage:
// import { storage } from './firebase';
// import {
//   ref,
//   uploadBytes,
//   uploadBytesResumable,
//   getDownloadURL,
//   deleteObject,
//   getBytes,
//   getMetadata,
// } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage
 * @param {Object} file - File object (from expo-image-picker or expo-document-picker)
 *   Should have: uri, name, type, size
 * @param {string} path - Storage path where the file should be uploaded
 *   Example: 'user_documents/document.pdf' or 'checklist_photos/photo.jpg'
 * @param {Function} [onProgress] - Optional progress callback: (progress) => void
 *   Progress is a number between 0 and 100
 * @returns {Promise<{url: string, path: string, error: null}>} Download URL and path on success
 * @throws {Error} Error object with code and message on failure
 */
export const uploadFile = async (file, path, onProgress = null) => {
  try {
    // TODO: Replace with real Firebase Storage call
    // // Validate file size
    // if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
    //   throw { code: 'storage/file-too-large', message: FILE_LIMITS.FILE_TOO_LARGE };
    // }
    //
    // // Validate file type
    // const allowedTypes = [...FILE_LIMITS.ALLOWED_IMAGE_TYPES, ...FILE_LIMITS.ALLOWED_DOCUMENT_TYPES];
    // if (!allowedTypes.includes(file.type)) {
    //   throw { code: 'storage/invalid-file-type', message: FILE_LIMITS.INVALID_FILE_TYPE };
    // }
    //
    // const storageRef = ref(storage, path);
    //
    // // If progress callback provided, use resumable upload
    // if (onProgress) {
    //   const uploadTask = uploadBytesResumable(storageRef, file);
    //   uploadTask.on('state_changed',
    //     (snapshot) => {
    //       const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //       onProgress(progress);
    //     },
    //     (error) => {
    //       throw error;
    //     },
    //     async () => {
    //       const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    //       return { url: downloadURL, path, error: null };
    //     }
    //   );
    // } else {
    //   await uploadBytes(storageRef, file);
    //   const downloadURL = await getDownloadURL(storageRef);
    //   return { url: downloadURL, path, error: null };
    // }

    // Mock implementation
    if (!file || !path) {
      throw { code: 'invalid-argument', message: 'File and path are required' };
    }

    // Validate file size
    if (file.size && file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
      throw {
        code: 'storage/file-too-large',
        message: `File size exceeds ${FILE_LIMITS.MAX_SIZE_MB}MB limit`,
      };
    }

    // Validate file type
    const allowedTypes = [...FILE_LIMITS.ALLOWED_IMAGE_TYPES, ...FILE_LIMITS.ALLOWED_DOCUMENT_TYPES];
    if (file.type && !allowedTypes.includes(file.type)) {
      throw { code: 'storage/invalid-file-type', message: 'Invalid file type' };
    }

    // Simulate upload progress if callback provided
    if (onProgress) {
      const steps = [0, 25, 50, 75, 100];
      for (const progress of steps) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        onProgress(progress);
      }
    } else {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Generate mock download URL
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/mock-project.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=mock-token-${Date.now()}`;

    return { url: mockUrl, path, error: null };
  } catch (error) {
    // Map Storage error codes to user-friendly messages
    const errorMessages = {
      'storage/unauthorized': 'You do not have permission to upload files',
      'storage/canceled': 'Upload was canceled',
      'storage/unknown': 'An unknown error occurred',
      'storage/invalid-argument': 'Invalid file or path provided',
      'storage/file-too-large': `File size exceeds ${FILE_LIMITS.MAX_SIZE_MB}MB limit`,
      'storage/invalid-file-type': 'Invalid file type. Please select a supported file',
    };

    return {
      url: null,
      path: null,
      error: {
        code: error.code || 'storage/unknown',
        message: errorMessages[error.code] || error.message || 'An error occurred uploading the file',
      },
    };
  }
};

/**
 * Download a file from Firebase Storage
 * @param {string} path - Storage path of the file to download
 * @returns {Promise<{blob: Blob, error: null}>} File blob on success
 * @throws {Error} Error object with code and message on failure
 */
export const downloadFile = async (path) => {
  try {
    // TODO: Replace with real Firebase Storage call
    // const storageRef = ref(storage, path);
    // const bytes = await getBytes(storageRef);
    // return { blob: new Blob([bytes]), error: null };

    // Mock implementation
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create mock blob
    const mockBlob = new Blob(['Mock file content'], { type: 'application/octet-stream' });

    return { blob: mockBlob, error: null };
  } catch (error) {
    // Map Storage error codes to user-friendly messages
    const errorMessages = {
      'storage/object-not-found': 'File not found',
      'storage/unauthorized': 'You do not have permission to download this file',
      'storage/unknown': 'An unknown error occurred',
    };

    return {
      blob: null,
      error: {
        code: error.code || 'storage/unknown',
        message: errorMessages[error.code] || error.message || 'An error occurred downloading the file',
      },
    };
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Storage path of the file to delete
 * @returns {Promise<{error: null}>} Success object
 * @throws {Error} Error object with code and message on failure
 */
export const deleteFile = async (path) => {
  try {
    // TODO: Replace with real Firebase Storage call
    // const storageRef = ref(storage, path);
    // await deleteObject(storageRef);
    // return { error: null };

    // Mock implementation
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300));

    return { error: null };
  } catch (error) {
    // Map Storage error codes to user-friendly messages
    const errorMessages = {
      'storage/object-not-found': 'File not found',
      'storage/unauthorized': 'You do not have permission to delete this file',
      'storage/unknown': 'An unknown error occurred',
    };

    return {
      error: {
        code: error.code || 'storage/unknown',
        message: errorMessages[error.code] || error.message || 'An error occurred deleting the file',
      },
    };
  }
};

/**
 * Get the download URL for a file in Firebase Storage
 * @param {string} path - Storage path of the file
 * @returns {Promise<{url: string, error: null}>} Download URL on success
 * @throws {Error} Error object with code and message on failure
 */
export const getFileURL = async (path) => {
  try {
    // TODO: Replace with real Firebase Storage call
    // const storageRef = ref(storage, path);
    // const downloadURL = await getDownloadURL(storageRef);
    // return { url: downloadURL, error: null };

    // Mock implementation
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Generate mock download URL
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/mock-project.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=mock-token-${Date.now()}`;

    return { url: mockUrl, error: null };
  } catch (error) {
    // Map Storage error codes to user-friendly messages
    const errorMessages = {
      'storage/object-not-found': 'File not found',
      'storage/unauthorized': 'You do not have permission to access this file',
      'storage/unknown': 'An unknown error occurred',
    };

    return {
      url: null,
      error: {
        code: error.code || 'storage/unknown',
        message: errorMessages[error.code] || error.message || 'An error occurred getting the file URL',
      },
    };
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {string} path - Storage path of the file
 * @returns {Promise<{metadata: Object, error: null}>} File metadata on success
 * @throws {Error} Error object with code and message on failure
 */
export const getFileMetadata = async (path) => {
  try {
    // TODO: Replace with real Firebase Storage call
    // const storageRef = ref(storage, path);
    // const metadata = await getMetadata(storageRef);
    // return { metadata, error: null };

    // Mock implementation
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 200));

    const mockMetadata = {
      name: path.split('/').pop(),
      size: 1024000, // 1 MB
      contentType: 'application/pdf',
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    return { metadata: mockMetadata, error: null };
  } catch (error) {
    return {
      metadata: null,
      error: {
        code: error.code || 'storage/unknown',
        message: error.message || 'An error occurred getting file metadata',
      },
    };
  }
};
