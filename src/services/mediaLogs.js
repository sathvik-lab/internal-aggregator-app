/**
 * Media Logs Service
 *
 * Handles creation, retrieval, and deletion of daily/weekly/monthly
 * photo/video logs with optional notes.
 */

import { getFirebaseAuth } from './firebase';
import { createDocument, deleteDocument, getDocument, queryDocuments } from './firestore';
import { uploadFile, deleteFile } from './storage';
import { STORAGE_PATHS, PAGINATION } from '../constants/constants';

const UNAUTHENTICATED_ERROR = {
  code: 'auth/unauthenticated',
  message: 'You must be signed in to access media logs.',
};

/**
 * Safely resolve the current authenticated user ID.
 * Returns null when auth is unavailable or the user is signed out.
 *
 * @returns {string|null}
 */
const getCurrentUserId = () => {
  try {
    const authInstance = getFirebaseAuth();
    return authInstance?.currentUser?.uid || null;
  } catch (error) {
    return null;
  }
};

/**
 * Normalize a Date to an ISO date string (YYYY-MM-DD) for grouping.
 * @param {Date} date
 * @returns {string}
 */
const getLogDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Compute start and end dates for a given range type.
 * @param {'daily'|'weekly'|'monthly'|'all'} rangeType
 * @returns {{startDate: string|null, endDate: string|null}}
 */
const getDateRangeForType = (rangeType) => {
  if (rangeType === 'all') {
    return { startDate: null, endDate: null };
  }

  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (rangeType) {
    case 'daily': {
      // Today only
      return {
        startDate: getLogDateString(start),
        endDate: getLogDateString(end),
      };
    }
    case 'weekly': {
      // Start of this week (Monday) to today
      const day = now.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      start.setDate(now.getDate() + diffToMonday);
      return {
        startDate: getLogDateString(start),
        endDate: getLogDateString(end),
      };
    }
    case 'monthly': {
      // First day of month to today
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: getLogDateString(start),
        endDate: getLogDateString(end),
      };
    }
    default:
      return { startDate: null, endDate: null };
  }
};

/**
 * Upload a media log (photo or video) with an optional note.
 *
 * @param {Object} params
 * @param {string} params.uri - Local file URI
 * @param {'photo'|'video'} params.mediaType - Type of media
 * @param {string|null} [params.note] - Optional text note
 * @param {Function} [params.onProgress] - Optional upload progress callback (0-100)
 * @returns {Promise<{id: string|null, error: {code: string, message: string}|null}>}
 */
export const uploadMediaLog = async ({ uri, mediaType, note = null, onProgress }) => {
  const userId = getCurrentUserId();

  if (!userId) {
    return {
      id: null,
      error: UNAUTHENTICATED_ERROR,
    };
  }

  if (!uri || !mediaType) {
    return {
      id: null,
      error: {
        code: 'invalid-argument',
        message: 'Media URI and media type are required.',
      },
    };
  }

  const extension = uri.split('.').pop() || '';
  const fileName = `${Date.now()}-${userId}.${extension}`;
  const storageBasePath = STORAGE_PATHS.MEDIA_LOGS;

  // First upload the file to storage
  const file = {
    uri,
    name: fileName,
    // Rely on Storage rules for image/video contentType validation;
    // Expo's uri may not always include mime type, so leave type undefined when unknown.
  };

  // We'll generate the storage path using a temporary ID (timestamp-based) to avoid
  // an extra round trip for docId. The Firestore document will store the exact path.
  const storagePath = `${storageBasePath}/${userId}/${Date.now()}-${fileName}`;

  const uploadResult = await uploadFile(file, storagePath, onProgress);

  if (uploadResult.error) {
    return {
      id: null,
      error: uploadResult.error,
    };
  }

  const logDate = getLogDateString(new Date());

  const { id, error } = await createDocument('mediaLogs', {
    userId,
    mediaType,
    storagePath: uploadResult.path,
    thumbnailPath: null,
    note: note || null,
    logDate,
    checklistItemId: null,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    // Best-effort cleanup of the uploaded file if Firestore write fails
    if (uploadResult.path) {
      await deleteFile(uploadResult.path);
    }
    return { id: null, error };
  }

  return { id, error: null };
};

/**
 * Fetch media logs for the current user by range type.
 *
 * @param {'daily'|'weekly'|'monthly'|'all'} rangeType
 * @param {{ userId?: string }} [opts] - Optional; pass userId to avoid auth timing issues
 * @returns {Promise<{data: Array, error: {code: string, message: string}|null}>}
 */
export const fetchMediaLogs = async (rangeType = 'daily', opts = {}) => {
  const userId = opts.userId ?? getCurrentUserId();

  if (!userId) {
    return {
      data: [],
      error: UNAUTHENTICATED_ERROR,
    };
  }

  const { startDate, endDate } = getDateRangeForType(rangeType);

  const conditions = [
    { field: 'userId', operator: '==', value: userId },
  ];

  if (startDate && endDate) {
    conditions.push(
      { field: 'logDate', operator: '>=', value: startDate },
      { field: 'logDate', operator: '<=', value: endDate },
    );
  }

  const { data, error } = await queryDocuments('mediaLogs', conditions, {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  return { data, error };
};

/**
 * Delete a media log and its associated storage object.
 *
 * @param {Object} params
 * @param {string} params.id - Firestore document ID
 * @param {string} params.storagePath - Storage path of the media file
 * @returns {Promise<{error: {code: string, message: string}|null}>}
 */
export const deleteMediaLog = async ({ id, storagePath }) => {
  const userId = getCurrentUserId();

  if (!userId) {
    return {
      error: UNAUTHENTICATED_ERROR,
    };
  }

  const { data: existingLog, error: fetchError } = await getDocument('mediaLogs', id);
  if (fetchError) {
    return { error: fetchError };
  }
  if (!existingLog || existingLog.userId !== userId) {
    return {
      error: {
        code: 'permission-denied',
        message: 'You do not have permission to delete this media log.',
      },
    };
  }

  // Delete Firestore document first; if that succeeds, delete the file.
  const { error: docError } = await deleteDocument('mediaLogs', id);

  if (docError) {
    return { error: docError };
  }

  if (storagePath) {
    await deleteFile(storagePath);
  }

  return { error: null };
};

export default {
  uploadMediaLog,
  fetchMediaLogs,
  deleteMediaLog,
};
