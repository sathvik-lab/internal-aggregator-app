/**
 * Compliance Score v2 utility
 *
 * Calculates a 0–100 readiness score based on:
 * - Checklist completion %
 * - Overdue item penalties
 * - Expiring/expired document penalties
 * - Recent media activity bonus
 */

/**
 * Calculate checklist completion percentage
 * @param {Array} checklistItems - All checklist items
 * @returns {number} 0–100 completion %
 */
const getChecklistCompletionScore = (checklistItems = []) => {
  if (checklistItems.length === 0) return 0;
  
  const completedCount = checklistItems.filter((item) => item.completed).length;
  return Math.round((completedCount / checklistItems.length) * 100);
};

/**
 * Calculate overdue penalty
 * Deducts 8 points per overdue item, max 40 points
 * Uses checklist item `priority` as canonical critical signal.
 * Critical overdue items add an extra 6 points each, max 18.
 * @param {Array} overdueItems
 * @returns {Object} { totalPenalty, basePenalty, criticalPenalty, criticalOverdueCount }
 */
const getOverduePenalty = (overdueItems = []) => {
  const basePenalty = Math.min(40, overdueItems.length * 8);
  const criticalOverdueCount = overdueItems.filter((item) => item?.priority === 'critical').length;
  const criticalPenalty = Math.min(18, criticalOverdueCount * 6);

  return {
    totalPenalty: basePenalty + criticalPenalty,
    basePenalty,
    criticalPenalty,
    criticalOverdueCount,
  };
};

/**
 * Calculate expiring/expired document penalty
 * Deducts 3 points per expiring item, 10 points per expired item, max 30 points
 * @param {Array} expiringDocuments - Expiring within 30 days
 * @param {Array} expiredDocuments - Already expired
 * @returns {number} Penalty (0–30)
 */
const getExpiryDocumentPenalty = (expiringDocuments = [], expiredDocuments = []) => {
  let penalty = 0;
  penalty += expiringDocuments.length * 3;
  penalty += expiredDocuments.length * 10;
  return Math.min(30, penalty);
};

/**
 * Calculate media activity bonus
 * +5 points if ≥1 media log in last 7 days
 * +10 points if ≥3 media logs in last 7 days
 * @param {Array} mediaLogs - All media logs
 * @returns {number} Bonus (0–10)
 */
const getMediaActivityBonus = (mediaLogs = []) => {
  if (mediaLogs.length === 0) return 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogs = mediaLogs.filter((log) => {
    const logDate = new Date(log.createdAt || log.logDate);
    return !Number.isNaN(logDate.getTime()) && logDate >= sevenDaysAgo;
  });

  if (recentLogs.length >= 3) return 10;
  if (recentLogs.length >= 1) return 5;
  return 0;
};

const getOpenHighSeverityIncidentPenalty = (incidents = []) => {
  const openHighSeverityCount = incidents.filter((incident) => {
    const severity = String(incident?.severity || '').toLowerCase();
    const status = String(incident?.status || '').toLowerCase();
    const isOpen = status !== 'resolved' && status !== 'closed';
    return isOpen && severity === 'severe';
  }).length;
  const penalty = Math.min(16, openHighSeverityCount * 4);
  return { penalty, openHighSeverityCount };
};

const getOverdueMaintenancePenalty = (maintenanceTasks = []) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueMaintenanceCount = maintenanceTasks.filter((task) => {
    const dueDate = new Date(task?.dueDate);
    const status = String(task?.status || '').toLowerCase();
    const isClosed = status === 'completed' || status === 'resolved' || status === 'closed';
    return !Number.isNaN(dueDate.getTime()) && dueDate < now && !isClosed;
  }).length;
  const penalty = Math.min(14, overdueMaintenanceCount * 3);
  return { penalty, overdueMaintenanceCount };
};

/**
 * Calculate compliance readiness score v2
 *
 * Formula:
 * Base = checklistCompletionScore
 * Adjustments:
 *   - Overdue penalty (0–40)
 *   - Expiring/expired penalty (0–30)
 *   - Open severe incident penalty (0–16)
 *   - Overdue maintenance penalty (0–14)
 *   + Media bonus (0–10)
 * Result = clamp(Base - overduePenalty - expiryPenalty - incidentPenalty - maintenancePenalty + mediaBonus, 0, 100)
 *
 * @param {Object} params
 * @param {Array} params.checklistItems - All checklist items
 * @param {Array} params.overdueItems - Overdue items
 * @param {Array} params.expiringDocuments - Expiring documents (next 30 days)
 * @param {Array} params.expiredDocuments - Already expired documents
 * @param {Array} params.mediaLogs - All media logs
 * @param {Array} params.incidents - Incident items
 * @param {Array} params.maintenanceTasks - Maintenance items
 * @returns {Object} {
 *   score: number (0–100),
 *   checklistCompletion: number (0–100),
 *   overduePenalty: number (0–58),
 *   overdueBasePenalty: number (0–40),
 *   criticalOverduePenalty: number (0–18),
 *   expiryPenalty: number (0–30),
 *   openHighSeverityIncidentPenalty: number (0–16),
 *   overdueMaintenancePenalty: number (0–14),
 *   mediaBonus: number (0–10),
 *   factors: {
 *     totalChecklistItems: number,
 *     completedChecklistItems: number,
 *     overdueCount: number,
 *     criticalOverdueCount: number,
 *     expiringCount: number,
 *     expiredCount: number,
 *     openHighSeverityIncidentCount: number,
 *     overdueMaintenanceCount: number,
 *     recentMediaLogsCount: number,
 *   }
 * }
 */
export const calculateComplianceScore = ({
  checklistItems = [],
  overdueItems = [],
  expiringDocuments = [],
  expiredDocuments = [],
  mediaLogs = [],
  incidents = [],
  maintenanceTasks = [],
} = {}) => {
  const checklistCompletion = getChecklistCompletionScore(checklistItems);
  const {
    totalPenalty: overduePenalty,
    basePenalty: overdueBasePenalty,
    criticalPenalty: criticalOverduePenalty,
    criticalOverdueCount,
  } = getOverduePenalty(overdueItems);
  const expiryPenalty = getExpiryDocumentPenalty(expiringDocuments, expiredDocuments);
  const mediaBonus = getMediaActivityBonus(mediaLogs);
  const {
    penalty: openHighSeverityIncidentPenalty,
    openHighSeverityCount,
  } = getOpenHighSeverityIncidentPenalty(incidents);
  const {
    penalty: overdueMaintenancePenalty,
    overdueMaintenanceCount,
  } = getOverdueMaintenancePenalty(maintenanceTasks);

  let score = checklistCompletion
    - overduePenalty
    - expiryPenalty
    - openHighSeverityIncidentPenalty
    - overdueMaintenancePenalty
    + mediaBonus;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Count recent media logs (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentMediaLogsCount = mediaLogs.filter((log) => {
    const logDate = new Date(log.createdAt || log.logDate);
    return !Number.isNaN(logDate.getTime()) && logDate >= sevenDaysAgo;
  }).length;

  return {
    score,
    checklistCompletion,
    overduePenalty,
    overdueBasePenalty,
    criticalOverduePenalty,
    expiryPenalty,
    openHighSeverityIncidentPenalty,
    overdueMaintenancePenalty,
    mediaBonus,
    factors: {
      totalChecklistItems: checklistItems.length,
      completedChecklistItems: checklistItems.filter((item) => item.completed).length,
      overdueCount: overdueItems.length,
      criticalOverdueCount,
      expiringCount: expiringDocuments.length,
      expiredCount: expiredDocuments.length,
      openHighSeverityIncidentCount: openHighSeverityCount,
      overdueMaintenanceCount,
      recentMediaLogsCount,
    },
  };
};

/**
 * Get human-readable score description
 * @param {number} score
 * @returns {Object} { label, description, color }
 */
export const getScoreDescription = (score) => {
  if (score >= 80) {
    return {
      label: 'Excellent',
      description: 'You are well-positioned for inspection.',
      color: '#10B981',
    };
  }
  if (score >= 60) {
    return {
      label: 'Good',
      description: 'You are mostly compliant, but some items need attention.',
      color: '#3B82F6',
    };
  }
  if (score >= 40) {
    return {
      label: 'Fair',
      description: 'You have important compliance gaps to address.',
      color: '#F59E0B',
    };
  }
  return {
    label: 'Low',
    description: 'Urgent action required to meet compliance standards.',
    color: '#EF4444',
  };
};

export default {
  calculateComplianceScore,
  getScoreDescription,
};
