import { getFirebaseAuth } from './firebase';
import { createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './firestore';
import { uploadFile, deleteFile } from './storage';
import { PAGINATION, STORAGE_PATHS } from '../constants/constants';
import { getDefaultBusinessId } from './userProfile';

const UNAUTHENTICATED_ERROR = {
  code: 'auth/unauthenticated',
  message: 'You must be signed in to access maintenance tasks.',
};

const getCurrentUserId = () => {
  try {
    const auth = getFirebaseAuth();
    return auth?.currentUser?.uid || null;
  } catch (_error) {
    return null;
  }
};

const resolveBusinessId = async (userId, businessId) => {
  if (businessId) return businessId;
  const result = await getDefaultBusinessId(userId);
  return result.businessId || null;
};

const mergeById = (preferred = [], fallback = []) => {
  const map = new Map();
  preferred.forEach((item) => map.set(item.id, item));
  fallback.forEach((item) => {
    if (!item?.businessId || !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const buildFileName = (title = 'maintenance', mediaType = 'image') => {
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  const normalized = String(title || 'maintenance').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `${normalized || 'maintenance'}-${Date.now()}.${ext}`;
};

export const listMaintenanceTasks = async (opts = {}) => {
  const userId = opts.userId ?? getCurrentUserId();
  if (!userId) {
    return { data: [], error: UNAUTHENTICATED_ERROR };
  }

  const businessId = await resolveBusinessId(userId, opts.businessId);
  const scopedFilters = [];
  if (opts.status) {
    scopedFilters.push({ field: 'status', operator: '==', value: opts.status });
  }
  if (opts.assigneeUserId) {
    scopedFilters.push({ field: 'assigneeUserId', operator: '==', value: opts.assigneeUserId });
  }
  if (opts.incidentId) {
    scopedFilters.push({ field: 'incidentId', operator: '==', value: opts.incidentId });
  }

  const options = {
    orderBy: { field: 'dueDate', direction: 'asc' },
    limit: opts.limit || PAGINATION.DEFAULT_PAGE_SIZE,
  };

  const businessQuery = businessId
    ? queryDocuments('maintenanceTasks', [{ field: 'businessId', operator: '==', value: businessId }, ...scopedFilters], options)
    : Promise.resolve({ data: [], error: null });
  const userQuery = queryDocuments('maintenanceTasks', [{ field: 'userId', operator: '==', value: userId }, ...scopedFilters], options);

  const [businessResult, userResult] = await Promise.all([businessQuery, userQuery]);
  const error = businessResult.error || userResult.error;
  if (error) {
    return { data: [], error };
  }

  const data = mergeById(businessResult.data || [], userResult.data || []).sort((a, b) => {
    const left = new Date(a.dueDate || 0).getTime();
    const right = new Date(b.dueDate || 0).getTime();
    return left - right;
  });

  return { data, error: null };
};

export const createMaintenanceTask = async ({
  title,
  status = 'pending',
  dueDate,
  description = null,
  assigneeUserId = null,
  incidentId = null,
  notes = null,
  mediaFile = null,
  mediaType = 'image',
  onProgress,
  businessId: providedBusinessId = null,
} = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { id: null, error: UNAUTHENTICATED_ERROR };
  }
  if (!title || typeof title !== 'string') {
    return { id: null, error: { code: 'invalid-argument', message: 'Task title is required.' } };
  }
  if (!dueDate) {
    return { id: null, error: { code: 'invalid-argument', message: 'dueDate is required.' } };
  }

  const businessId = await resolveBusinessId(userId, providedBusinessId);
  const nowIso = new Date().toISOString();
  let attachments = [];

  if (mediaFile?.uri) {
    const fileName = mediaFile.name || buildFileName(title, mediaType);
    const storagePath = `${STORAGE_PATHS.INCIDENT_PHOTOS}/${userId}/${Date.now()}-maintenance-${fileName}`;
    const uploadResult = await uploadFile(
      {
        uri: mediaFile.uri,
        name: fileName,
        type: mediaFile.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: mediaFile.size,
      },
      storagePath,
      onProgress
    );
    if (uploadResult.error) {
      return { id: null, error: uploadResult.error };
    }
    attachments = [{
      url: uploadResult.url,
      storagePath,
      mediaType,
      uploadedBy: userId,
      uploadedAt: nowIso,
    }];
  }

  const payload = {
    userId,
    ...(businessId ? { businessId } : {}),
    title: title.trim(),
    description: description?.trim() || null,
    status,
    dueDate,
    assigneeUserId: assigneeUserId || null,
    incidentId: incidentId || null,
    notes: notes?.trim() || null,
    attachments,
    completedAt: null,
    createdByUserId: userId,
    updatedByUserId: userId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const result = await createDocument('maintenanceTasks', payload);
  if (result.error) {
    if (attachments.length > 0) {
      await deleteFile(attachments[0].storagePath);
    }
    return { id: null, error: result.error };
  }

  return { id: result.id, error: null };
};

export const updateMaintenanceTask = async ({ taskId, updates = {} } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { error: UNAUTHENTICATED_ERROR };
  }
  if (!taskId) {
    return { error: { code: 'invalid-argument', message: 'taskId is required.' } };
  }

  const payload = {
    ...updates,
    updatedByUserId: userId,
    updatedAt: new Date().toISOString(),
  };

  if (updates.status === 'completed' && !updates.completedAt) {
    payload.completedAt = new Date().toISOString();
  }
  if (updates.status && updates.status !== 'completed') {
    payload.completedAt = null;
  }

  return updateDocument('maintenanceTasks', taskId, payload);
};

export const getMaintenanceTaskById = async (taskId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { data: null, error: UNAUTHENTICATED_ERROR };
  }
  if (!taskId) {
    return { data: null, error: { code: 'invalid-argument', message: 'taskId is required.' } };
  }
  return getDocument('maintenanceTasks', taskId);
};

export const deleteMaintenanceTask = async ({ taskId, attachmentPaths = [] } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { error: UNAUTHENTICATED_ERROR };
  }
  if (!taskId) {
    return { error: { code: 'invalid-argument', message: 'taskId is required.' } };
  }

  const existing = await getDocument('maintenanceTasks', taskId);
  if (existing.error) {
    return { error: existing.error };
  }

  const existingPaths = Array.isArray(existing.data?.attachments)
    ? existing.data.attachments.map((entry) => entry?.storagePath).filter(Boolean)
    : [];

  const result = await deleteDocument('maintenanceTasks', taskId);
  if (result.error) {
    return { error: result.error };
  }

  const allPaths = [...new Set([...existingPaths, ...attachmentPaths])];
  await Promise.all(allPaths.map(async (path) => {
    await deleteFile(path);
  }));

  return { error: null };
};

export const attachMaintenanceMedia = async ({ taskId, file, mediaType = 'image', onProgress } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { data: null, error: UNAUTHENTICATED_ERROR };
  }
  if (!taskId || !file?.uri) {
    return {
      data: null,
      error: { code: 'invalid-argument', message: 'taskId and file are required.' },
    };
  }

  const existing = await getDocument('maintenanceTasks', taskId);
  if (existing.error || !existing.data) {
    return { data: null, error: existing.error || { code: 'not-found', message: 'Task not found.' } };
  }

  const fileName = file.name || buildFileName(existing.data.title, mediaType);
  const storagePath = `${STORAGE_PATHS.INCIDENT_PHOTOS}/${userId}/${Date.now()}-maintenance-${fileName}`;
  const uploadResult = await uploadFile(
    {
      uri: file.uri,
      name: fileName,
      type: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      size: file.size,
    },
    storagePath,
    onProgress
  );
  if (uploadResult.error) {
    return { data: null, error: uploadResult.error };
  }

  const attachment = {
    url: uploadResult.url,
    storagePath,
    mediaType,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
  };
  const updatedAttachments = [...(existing.data.attachments || []), attachment];
  const updateResult = await updateDocument('maintenanceTasks', taskId, {
    attachments: updatedAttachments,
    updatedByUserId: userId,
  });
  if (updateResult.error) {
    await deleteFile(storagePath);
    return { data: null, error: updateResult.error };
  }

  return { data: attachment, error: null };
};

export default {
  listMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  getMaintenanceTaskById,
  deleteMaintenanceTask,
  attachMaintenanceMedia,
};
