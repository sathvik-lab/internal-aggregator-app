/**
 * Firebase Storage Service
 * 
 * This service provides file upload/download operations for Firebase Storage.
 */

import { storage } from './firebase';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getBytes,
  getMetadata,
} from 'firebase/storage';
import { FILE_LIMITS, STORAGE_PATHS, ERROR_MESSAGES } from '../constants/constants';
import { handleAsyncOperation, getErrorMessage, isNetworkError } from '../utils/errorHandler';

/**
 * Convert a file URI to a Blob (for React Native/Expo)
 * @param {string} uri - File URI
 * @returns {Promise<Blob>} File blob
 */
const uriToBlob = async (uri) => {
  const response = await fetch(uri);
  return await response.blob();
};

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
  // Validate inputs
  if (!file || typeof file !== 'object') {
    return {
      url: null,
      path: null,
      error: {
        code: 'invalid-argument',
        message: 'File is required and must be an object',
      },
    };
  }

  if (!path || typeof path !== 'string') {
    return {
      url: null,
      path: null,
      error: {
        code: 'invalid-argument',
        message: 'Path is required and must be a string',
      },
    };
  }

  if (!file.uri) {
    return {
      url: null,
      path: null,
      error: {
        code: 'invalid-argument',
        message: 'File URI is required',
      },
    };
  }

  const fileSize = typeof file.size === 'number' ? file.size : null;
  if (fileSize == null) {
    return {
      url: null,
      path: null,
      error: {
        code: 'storage/missing-file-size',
        message: 'File size metadata is missing',
      },
    };
  }

  // Validate file size
  if (fileSize > FILE_LIMITS.MAX_SIZE_BYTES) {
    return {
      url: null,
      path: null,
      error: {
        code: 'storage/file-too-large',
        message: `File size exceeds ${FILE_LIMITS.MAX_SIZE_MB}MB limit`,
      },
    };
  }

  // Validate file type
  const allowedTypes = [
    ...FILE_LIMITS.ALLOWED_IMAGE_TYPES,
    ...FILE_LIMITS.ALLOWED_DOCUMENT_TYPES,
    ...(FILE_LIMITS.ALLOWED_VIDEO_TYPES || []),
  ];
  const fileType = file.type || null;
  if (!fileType) {
    return {
      url: null,
      path: null,
      error: {
        code: 'storage/missing-file-type',
        message: 'File type metadata is missing',
      },
    };
  }
  if (!allowedTypes.includes(fileType)) {
    return {
      url: null,
      path: null,
      error: {
        code: 'storage/invalid-file-type',
        message: ERROR_MESSAGES.INVALID_FILE_TYPE,
      },
    };
  }

  // Check if storage is available
  if (!storage) {
    return {
      url: null,
      path: null,
      error: {
        code: 'unavailable',
        message: 'Storage is not available. Please check your connection.',
      },
    };
  }

  const storageRef = ref(storage, path);

  // Convert URI to Blob for React Native/Expo
  try {
    const blob = await uriToBlob(file.uri);

    // If progress callback provided, use resumable upload
    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: fileType || 'application/octet-stream',
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            try {
              const progress = snapshot.totalBytes
                ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                : 0;
              onProgress(Math.min(100, Math.max(0, progress)));
            } catch (progressError) {
              console.error('Error in progress callback:', progressError);
            }
          },
          (error) => {
            reject({
              code: error.code || 'storage/unknown',
              message: getErrorMessage(error, 'An error occurred uploading the file'),
            });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadURL, path, error: null });
            } catch (error) {
              reject({
                code: error.code || 'storage/unknown',
                message: getErrorMessage(error, 'An error occurred getting the download URL'),
              });
            }
          }
        );
      }).catch(error => ({
        url: null,
        path: null,
        error: {
          code: error.code || 'storage/unknown',
          message: getErrorMessage(error, 'An error occurred uploading the file'),
        },
      }));
    } else {
      // Simple upload without progress tracking
      return handleAsyncOperation(
        async () => {
          await uploadBytes(storageRef, blob, {
            contentType: fileType || 'application/octet-stream',
          });
          const downloadURL = await getDownloadURL(storageRef);
          return { url: downloadURL, path };
        },
        {
          timeout: 60000, // Longer timeout for file uploads
          checkNetwork: true,
          defaultMessage: 'An error occurred uploading the file',
        }
      ).then(result => {
        if (result.error) {
          return {
            url: null,
            path: null,
            error: {
              code: result.error.code,
              message: getErrorMessage(result.error, 'An error occurred uploading the file'),
            },
          };
        }
        return { ...result.data, error: null };
      });
    }
  } catch (error) {
    return {
      url: null,
      path: null,
      error: {
        code: error.code || 'storage/unknown',
        message: getErrorMessage(error, 'An error occurred uploading the file'),
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
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }
    if (!storage) {
      throw { code: 'storage/unavailable', message: 'Storage is not initialized' };
    }

    const storageRef = ref(storage, path);
    const bytes = await getBytes(storageRef);
    return { blob: new Blob([bytes]), error: null };
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
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
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
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    return { url: downloadURL, error: null };
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
    if (!path) {
      throw { code: 'invalid-argument', message: 'Path is required' };
    }

    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    return { metadata, error: null };
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
