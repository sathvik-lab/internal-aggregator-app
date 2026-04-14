import { queryDocuments } from './firestore';
import { fetchMediaLogs } from './mediaLogs';
import { getUserProfileDocument } from './userProfile';
import { listIncidents } from './incidents';
import { listMaintenanceTasks } from './maintenanceTasks';
import { getDocumentTypeValue } from '../utils/documentTypes';
import { getRequiredDocumentsForState } from '../config/requiredDocumentsByState';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_DAYS = 30;

const getStartOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getEndOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeRangeDate = (value, boundary = 'start') => {
  const parsed = parseDate(value);
  if (!parsed) return null;

  if (boundary === 'end') {
    return getEndOfDay(parsed);
  }

  return getStartOfDay(parsed);
};

const getChecklistActivityDate = (item) => (
  parseDate(item?.completedAt)
  || parseDate(item?.updatedAt)
  || parseDate(item?.createdAt)
  || parseDate(item?.dueDate)
);

const getMediaActivityDate = (log) => (
  parseDate(log?.createdAt)
  || parseDate(log?.logDate)
);

const getIncidentActivityDate = (incident) => (
  parseDate(incident?.createdAt)
  || parseDate(incident?.updatedAt)
  || parseDate(incident?.occurredAt)
);

const getMaintenanceActivityDate = (task) => (
  parseDate(task?.dueDate)
  || parseDate(task?.updatedAt)
  || parseDate(task?.createdAt)
);

const isWithinRange = (date, startDate, endDate) => {
  if (!date) return false;
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
};

const sortByDateAsc = (items, getValue) => (
  [...items].sort((a, b) => {
    const dateA = parseDate(getValue(a)) || new Date(8640000000000000);
    const dateB = parseDate(getValue(b)) || new Date(8640000000000000);
    return dateA - dateB;
  })
);

const sortByDateDesc = (items, getValue) => (
  [...items].sort((a, b) => {
    const dateA = parseDate(getValue(a)) || new Date(0);
    const dateB = parseDate(getValue(b)) || new Date(0);
    return dateB - dateA;
  })
);

const buildReadinessSummary = ({
  totalDocuments,
  dueTodayCount,
  overdueCount,
  expiringCount,
  mediaLogCount,
}) => {
  let score = 100;
  score -= Math.min(45, overdueCount * 20);
  score -= Math.min(24, dueTodayCount * 8);
  score -= Math.min(18, expiringCount * 6);

  if (totalDocuments === 0) {
    score -= 10;
  }

  if (mediaLogCount === 0) {
    score -= 5;
  }

  score = Math.max(0, Math.round(score));

  let tone = 'good';
  let title = 'Inspection-ready today';
  let message = 'Your urgent checklist work is under control, and there are no immediate document deadlines pulling you off track.';
  let nextAction = 'Keep logging routine checks and upload supporting documents as they change.';

  if (overdueCount > 0) {
    tone = 'critical';
    title = 'Needs immediate attention';
    message = `You have ${overdueCount} overdue checklist item${overdueCount === 1 ? '' : 's'} blocking readiness right now.`;
    nextAction = 'Start with the overdue checklist items, then review anything due today.';
  } else if (dueTodayCount > 0 || expiringCount > 0) {
    tone = 'warning';
    title = 'Mostly ready, but time-sensitive work remains';
    message = `You have ${dueTodayCount} item${dueTodayCount === 1 ? '' : 's'} due today and ${expiringCount} document${expiringCount === 1 ? '' : 's'} expiring within 30 days.`;
    nextAction = 'Finish today’s checklist items and renew expiring documents before they become blockers.';
  } else if (totalDocuments === 0) {
    tone = 'warning';
    title = 'Operationally ready, but documentation is thin';
    message = 'Your checklist workload looks manageable, but you do not have compliance documents on file yet.';
    nextAction = 'Upload your core compliance documents so readiness is backed by evidence.';
  } else if (mediaLogCount === 0) {
    tone = 'warning';
    title = 'Ready on paper, but activity logs are missing';
    message = 'Checklist work and documents look healthy, but there are no recent media logs to support field activity.';
    nextAction = 'Add a photo or video log so recent operational evidence is easy to show.';
  }

  return {
    score,
    tone,
    title,
    message,
    nextAction,
  };
};

export const fetchDashboardSnapshot = async (userId, options = {}) => {
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  const startDate = normalizeRangeDate(options.startDate, 'start');
  const endDate = normalizeRangeDate(options.endDate, 'end');

  const profileResult = await getUserProfileDocument(userId);
  const userProfile = profileResult?.data || {};
  const preferredBusinessId = options.businessId
    || userProfile?.defaultBusinessId
    || null;

  const documentsByBusinessPromise = preferredBusinessId
    ? queryDocuments('documents', [{ field: 'businessId', operator: '==', value: preferredBusinessId }])
    : Promise.resolve({ data: [], error: null });
  const checklistByBusinessPromise = preferredBusinessId
    ? queryDocuments('checklistItems', [{ field: 'businessId', operator: '==', value: preferredBusinessId }])
    : Promise.resolve({ data: [], error: null });

  const [documentsByBusinessResult, checklistByBusinessResult, documentsByUserResult, checklistByUserResult, mediaLogsResult, incidentsResult, maintenanceResult] = await Promise.all([
    documentsByBusinessPromise,
    checklistByBusinessPromise,
    queryDocuments('documents', [{ field: 'userId', operator: '==', value: userId }]),
    queryDocuments('checklistItems', [{ field: 'userId', operator: '==', value: userId }]),
    fetchMediaLogs('all', { userId, businessId: preferredBusinessId }),
    listIncidents({ userId, businessId: preferredBusinessId, limit: 200 }),
    listMaintenanceTasks({ userId, businessId: preferredBusinessId, limit: 200 }),
  ]);

  const firstError = documentsByBusinessResult.error
    || checklistByBusinessResult.error
    || documentsByUserResult.error
    || checklistByUserResult.error
    || mediaLogsResult.error
    || incidentsResult.error
    || maintenanceResult.error;
  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const documentsMap = new Map();
  (documentsByBusinessResult.data || []).forEach((item) => documentsMap.set(item.id, item));
  (documentsByUserResult.data || []).forEach((item) => {
    if (!item?.businessId || !documentsMap.has(item.id)) {
      documentsMap.set(item.id, item);
    }
  });
  const documents = Array.from(documentsMap.values());

  const checklistMap = new Map();
  (checklistByBusinessResult.data || []).forEach((item) => checklistMap.set(item.id, item));
  (checklistByUserResult.data || []).forEach((item) => {
    if (!item?.businessId || !checklistMap.has(item.id)) {
      checklistMap.set(item.id, item);
    }
  });

  const checklistItems = Array.from(checklistMap.values()).filter((item) => {
    if (!startDate && !endDate) {
      return true;
    }
    return isWithinRange(getChecklistActivityDate(item), startDate, endDate);
  });
  const mediaLogs = (mediaLogsResult.data || []).filter((log) => {
    if (!startDate && !endDate) {
      return true;
    }
    return isWithinRange(getMediaActivityDate(log), startDate, endDate);
  });
  const incidents = (incidentsResult.data || []).filter((incident) => {
    if (!startDate && !endDate) {
      return true;
    }
    return isWithinRange(getIncidentActivityDate(incident), startDate, endDate);
  });
  const maintenanceTasks = (maintenanceResult.data || []).filter((task) => {
    if (!startDate && !endDate) {
      return true;
    }
    return isWithinRange(getMaintenanceActivityDate(task), startDate, endDate);
  });

  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();
  const expiringCutoff = new Date(todayEnd.getTime() + EXPIRING_WINDOW_DAYS * DAY_MS);

  const openChecklistItems = checklistItems.filter((item) => !item.completed);

  const dueTodayItems = sortByDateAsc(
    openChecklistItems.filter((item) => {
      const dueDate = parseDate(item.dueDate);
      return dueDate && dueDate >= todayStart && dueDate <= todayEnd;
    }),
    (item) => item.dueDate
  );

  const overdueItems = sortByDateAsc(
    openChecklistItems.filter((item) => {
      const dueDate = parseDate(item.dueDate);
      return dueDate && dueDate < todayStart;
    }),
    (item) => item.dueDate
  );

  const expiredDocuments = sortByDateAsc(
    documents.filter((document) => {
      const expiryDate = parseDate(document.expiryDate);
      return expiryDate && expiryDate < todayStart;
    }),
    (document) => document.expiryDate
  );

  const expiringDocuments = sortByDateAsc(
    documents.filter((document) => {
      const expiryDate = parseDate(document.expiryDate);
      return expiryDate && expiryDate >= todayStart && expiryDate <= expiringCutoff;
    }),
    (document) => document.expiryDate
  );

  const recentMediaLogs = sortByDateDesc(mediaLogs, (log) => log.createdAt || log.logDate).slice(0, 4);
  const openIncidents = incidents.filter((incident) => incident?.status !== 'resolved' && incident?.status !== 'closed');
  const overdueMaintenanceTasks = maintenanceTasks.filter((task) => {
    const dueDate = parseDate(task?.dueDate);
    if (!dueDate) return false;
    const status = String(task?.status || '').toLowerCase();
    return dueDate < todayStart && status !== 'completed' && status !== 'resolved' && status !== 'closed';
  });

  const readiness = buildReadinessSummary({
    totalDocuments: documents.length,
    dueTodayCount: dueTodayItems.length,
    overdueCount: overdueItems.length,
    expiringCount: expiringDocuments.length,
    mediaLogCount: recentMediaLogs.length,
  });

  const profileState = userProfile?.businessProfile?.location?.state || userProfile?.businessProfile?.state || null;
  const requiredDocsConfig = getRequiredDocumentsForState(profileState);
  const uploadedTypeSet = new Set(documents.map((doc) => getDocumentTypeValue(doc)));
  const missingRequiredDocumentTypes = requiredDocsConfig.requiredTypes.filter((type) => !uploadedTypeSet.has(type));

  return {
    data: {
      readiness,
      dueTodayItems,
      overdueItems,
      expiringDocuments,
      expiredDocuments,
      recentMediaLogs,
      incidents,
      maintenanceTasks,
      openIncidents,
      overdueMaintenanceTasks,
      missingRequiredDocumentTypes,
      recommendedRequiredDocumentTypes: requiredDocsConfig.fallbackTypes,
      hasRequiredDocumentsState: requiredDocsConfig.hasState,
      requiredDocumentsState: requiredDocsConfig.stateKey,
      businessProfile: userProfile?.businessProfile || null,
      allChecklistItems: checklistItems,
      counts: {
        documents: documents.length,
        dueToday: dueTodayItems.length,
        overdue: overdueItems.length,
        expiringDocuments: expiringDocuments.length,
        expiredDocuments: expiredDocuments.length,
        recentMediaLogs: recentMediaLogs.length,
        incidents: incidents.length,
        openIncidents: openIncidents.length,
        maintenanceTasks: maintenanceTasks.length,
        overdueMaintenanceTasks: overdueMaintenanceTasks.length,
        missingRequiredDocuments: missingRequiredDocumentTypes.length,
      },
      appliedRange: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
    },
    error: null,
  };
};

export default {
  fetchDashboardSnapshot,
};
