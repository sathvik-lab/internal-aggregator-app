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
 * @param {Array} overdueItems
 * @returns {number} Penalty (0–40)
 */
const getOverduePenalty = (overdueItems = []) => {
  return Math.min(40, overdueItems.length * 8);
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

/**
 * Calculate compliance readiness score v2
 *
 * Formula:
 * Base = checklistCompletionScore
 * Adjustments:
 *   - Overdue penalty (0–40)
 *   - Expiring/expired penalty (0–30)
 *   + Media bonus (0–10)
 * Result = clamp(Base - overduePenalty - expiryPenalty + mediaBonus, 0, 100)
 *
 * @param {Object} params
 * @param {Array} params.checklistItems - All checklist items
 * @param {Array} params.overdueItems - Overdue items
 * @param {Array} params.expiringDocuments - Expiring documents (next 30 days)
 * @param {Array} params.expiredDocuments - Already expired documents
 * @param {Array} params.mediaLogs - All media logs
 * @returns {Object} {
 *   score: number (0–100),
 *   checklistCompletion: number (0–100),
 *   overduePenalty: number (0–40),
 *   expiryPenalty: number (0–30),
 *   mediaBonus: number (0–10),
 *   factors: {
 *     totalChecklistItems: number,
 *     completedChecklistItems: number,
 *     overdueCount: number,
 *     expiringCount: number,
 *     expiredCount: number,
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
} = {}) => {
  const checklistCompletion = getChecklistCompletionScore(checklistItems);
  const overduePenalty = getOverduePenalty(overdueItems);
  const expiryPenalty = getExpiryDocumentPenalty(expiringDocuments, expiredDocuments);
  const mediaBonus = getMediaActivityBonus(mediaLogs);

  let score = checklistCompletion - overduePenalty - expiryPenalty + mediaBonus;
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
    expiryPenalty,
    mediaBonus,
    factors: {
      totalChecklistItems: checklistItems.length,
      completedChecklistItems: checklistItems.filter((item) => item.completed).length,
      overdueCount: overdueItems.length,
      expiringCount: expiringDocuments.length,
      expiredCount: expiredDocuments.length,
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
