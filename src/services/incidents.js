import { getFirebaseAuth } from './firebase';
import { createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './firestore';
import { uploadFile, deleteFile } from './storage';
import { INCIDENT_SEVERITY, INCIDENT_TYPES, PAGINATION, STORAGE_PATHS } from '../constants/constants';
import { getDefaultBusinessId } from './userProfile';
import { logAnalyticsEvent } from './analytics';

const UNAUTHENTICATED_ERROR = {
  code: 'auth/unauthenticated',
  message: 'You must be signed in to access incidents.',
};

const getCurrentUserId = () => {
  try {
    const auth = getFirebaseAuth();
    return auth?.currentUser?.uid || null;
  } catch (error) {
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

const buildBaseFileName = (name = 'incident', mediaType = 'image') => {
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  const normalized = String(name || 'incident').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `${normalized || 'incident'}-${Date.now()}.${ext}`;
};

export const listIncidents = async (opts = {}) => {
  const userId = opts.userId ?? getCurrentUserId();
  if (!userId) {
    return { data: [], error: UNAUTHENTICATED_ERROR };
  }

  const businessId = await resolveBusinessId(userId, opts.businessId);
  const scopedFilters = [];
  if (opts.status) {
    scopedFilters.push({ field: 'status', operator: '==', value: opts.status });
  }
  if (opts.severity) {
    scopedFilters.push({ field: 'severity', operator: '==', value: opts.severity });
  }
  if (opts.type) {
    scopedFilters.push({ field: 'type', operator: '==', value: opts.type });
  }

  const options = {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: opts.limit || PAGINATION.DEFAULT_PAGE_SIZE,
  };

  const businessQuery = businessId
    ? queryDocuments('incidents', [{ field: 'businessId', operator: '==', value: businessId }, ...scopedFilters], options)
    : Promise.resolve({ data: [], error: null });

  const userQuery = queryDocuments('incidents', [{ field: 'userId', operator: '==', value: userId }, ...scopedFilters], options);
  const [businessResult, userResult] = await Promise.all([businessQuery, userQuery]);
  const error = businessResult.error || userResult.error;
  if (error) {
    return { data: [], error };
  }

  const data = mergeById(businessResult.data || [], userResult.data || []).sort((a, b) => {
    const left = new Date(a.createdAt || 0).getTime();
    const right = new Date(b.createdAt || 0).getTime();
    return right - left;
  });

  return { data, error: null };
};

export const createIncident = async ({
  title,
  type = INCIDENT_TYPES.OTHER,
  severity = INCIDENT_SEVERITY.MINOR,
  description = null,
  status = 'open',
  occurredAt = null,
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
    return {
      id: null,
      error: { code: 'invalid-argument', message: 'Incident title is required.' },
    };
  }

  const businessId = await resolveBusinessId(userId, providedBusinessId);
  const nowIso = new Date().toISOString();
  let media = [];

  if (mediaFile?.uri) {
    const fileName = mediaFile.name || buildBaseFileName(title, mediaType);
    const storagePath = `${STORAGE_PATHS.INCIDENT_PHOTOS}/${userId}/${Date.now()}-${fileName}`;
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

    media = [{
      url: uploadResult.url,
      storagePath,
      mediaType,
      uploadedAt: nowIso,
      uploadedBy: userId,
    }];
  }

  const payload = {
    userId,
    ...(businessId ? { businessId } : {}),
    title: title.trim(),
    type,
    severity,
    status,
    description: description?.trim() || null,
    occurredAt: occurredAt || nowIso,
    notes: notes?.trim() || null,
    media,
    createdByUserId: userId,
    updatedByUserId: userId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const result = await createDocument('incidents', payload);
  if (result.error) {
    if (media.length > 0) {
      await deleteFile(media[0].storagePath);
    }
    return { id: null, error: result.error };
  }

  logAnalyticsEvent('incident_created', {
    incident_id: result.id,
    severity,
    type,
    source: 'incidents_service',
    phase: 'stub',
  });

  return { id: result.id, error: null };
};

export const updateIncident = async ({ incidentId, updates = {} } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { error: UNAUTHENTICATED_ERROR };
  }
  if (!incidentId) {
    return { error: { code: 'invalid-argument', message: 'incidentId is required.' } };
  }

  const payload = {
    ...updates,
    updatedByUserId: userId,
    updatedAt: new Date().toISOString(),
  };
  return updateDocument('incidents', incidentId, payload);
};

export const getIncidentById = async (incidentId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { data: null, error: UNAUTHENTICATED_ERROR };
  }
  if (!incidentId) {
    return { data: null, error: { code: 'invalid-argument', message: 'incidentId is required.' } };
  }
  return getDocument('incidents', incidentId);
};

export const deleteIncident = async ({ incidentId, mediaPaths = [] } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { error: UNAUTHENTICATED_ERROR };
  }
  if (!incidentId) {
    return { error: { code: 'invalid-argument', message: 'incidentId is required.' } };
  }

  const existing = await getDocument('incidents', incidentId);
  if (existing.error) {
    return { error: existing.error };
  }

  const existingMediaPaths = Array.isArray(existing.data?.media)
    ? existing.data.media.map((entry) => entry?.storagePath).filter(Boolean)
    : [];

  const result = await deleteDocument('incidents', incidentId);
  if (result.error) {
    return { error: result.error };
  }

  const allPaths = [...new Set([...existingMediaPaths, ...mediaPaths])];
  await Promise.all(allPaths.map(async (path) => {
    await deleteFile(path);
  }));

  return { error: null };
};

export const attachIncidentMedia = async ({ incidentId, file, mediaType = 'image', onProgress } = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { data: null, error: UNAUTHENTICATED_ERROR };
  }
  if (!incidentId || !file?.uri) {
    return {
      data: null,
      error: { code: 'invalid-argument', message: 'incidentId and file are required.' },
    };
  }

  const existing = await getDocument('incidents', incidentId);
  if (existing.error || !existing.data) {
    return { data: null, error: existing.error || { code: 'not-found', message: 'Incident not found.' } };
  }

  const fileName = file.name || buildBaseFileName(existing.data.title, mediaType);
  const storagePath = `${STORAGE_PATHS.INCIDENT_PHOTOS}/${userId}/${Date.now()}-${fileName}`;
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

  const mediaEntry = {
    url: uploadResult.url,
    storagePath,
    mediaType,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
  };

  const updatedMedia = [...(existing.data.media || []), mediaEntry];
  const updateResult = await updateDocument('incidents', incidentId, {
    media: updatedMedia,
    updatedByUserId: userId,
  });
  if (updateResult.error) {
    await deleteFile(storagePath);
    return { data: null, error: updateResult.error };
  }

  return { data: mediaEntry, error: null };
};

export default {
  listIncidents,
  createIncident,
  updateIncident,
  getIncidentById,
  deleteIncident,
  attachIncidentMedia,
};
