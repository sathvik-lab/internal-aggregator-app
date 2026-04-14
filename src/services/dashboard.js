import { queryDocuments } from './firestore';
import { fetchMediaLogs } from './mediaLogs';

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

export const fetchDashboardSnapshot = async (userId) => {
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'invalid-argument',
        message: 'User ID is required.',
      },
    };
  }

  const [documentsResult, checklistResult, mediaLogsResult] = await Promise.all([
    queryDocuments('documents', [{ field: 'userId', operator: '==', value: userId }]),
    queryDocuments('checklistItems', [{ field: 'userId', operator: '==', value: userId }]),
    fetchMediaLogs('all', { userId }),
  ]);

  const firstError = documentsResult.error || checklistResult.error || mediaLogsResult.error;
  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const documents = documentsResult.data || [];
  const checklistItems = checklistResult.data || [];
  const mediaLogs = mediaLogsResult.data || [];

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

  const readiness = buildReadinessSummary({
    totalDocuments: documents.length,
    dueTodayCount: dueTodayItems.length,
    overdueCount: overdueItems.length,
    expiringCount: expiringDocuments.length,
    mediaLogCount: recentMediaLogs.length,
  });

  return {
    data: {
      readiness,
      dueTodayItems,
      overdueItems,
      expiringDocuments,
      expiredDocuments,
      recentMediaLogs,
      allChecklistItems: checklistItems,
      counts: {
        documents: documents.length,
        dueToday: dueTodayItems.length,
        overdue: overdueItems.length,
        expiringDocuments: expiringDocuments.length,
        expiredDocuments: expiredDocuments.length,
        recentMediaLogs: recentMediaLogs.length,
      },
    },
    error: null,
  };
};

export default {
  fetchDashboardSnapshot,
};
