/**
 * Checklist Scheduling Service
 * 
 * Generates user-specific checklist instances from templates based on frequency.
 * Handles daily, weekly, monthly, quarterly, yearly, and one-time schedules.
 */

import { createDocument } from './firestore';
import { CHECKLIST_FREQUENCIES } from '../constants/checklistConstants';

/**
 * Get the start of the week (Monday) for a given date
 * 
 * @param {Date} date - Date to get week start for
 * @returns {Date} - Start of week (Monday)
 */
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * Get the start of the month for a given date
 * 
 * @param {Date} date - Date to get month start for
 * @returns {Date} - Start of month
 */
export const getMonthStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Get the start of the quarter for a given date
 * 
 * @param {Date} date - Date to get quarter start for
 * @returns {Date} - Start of quarter
 */
export const getQuarterStart = (date) => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), quarter * 3, 1);
};

/**
 * Get the start of the year for a given date
 * 
 * @param {Date} date - Date to get year start for
 * @returns {Date} - Start of year
 */
export const getYearStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
};

/**
 * Calculate the next due date based on template frequency
 * 
 * @param {Object} template - Checklist template
 * @param {Date} baseDate - Base date to calculate from (default: today)
 * @returns {string} - ISO timestamp string for due date
 */
export const calculateNextDueDate = (template, baseDate = new Date()) => {
  const { frequency, defaultDueTime } = template;
  const [hours, minutes] = (defaultDueTime || '09:00').split(':').map(Number);

  const dueDate = new Date(baseDate);
  dueDate.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case CHECKLIST_FREQUENCIES.DAILY:
      // Due today at defaultDueTime
      break;

    case CHECKLIST_FREQUENCIES.WEEKLY:
      // Due this week (Monday) at defaultDueTime
      const weekStart = getWeekStart(baseDate);
      dueDate.setFullYear(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      break;

    case CHECKLIST_FREQUENCIES.MONTHLY:
      // Due this month (1st) at defaultDueTime
      const monthStart = getMonthStart(baseDate);
      dueDate.setFullYear(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
      break;

    case CHECKLIST_FREQUENCIES.QUARTERLY:
      // Due this quarter (1st of quarter) at defaultDueTime
      const quarterStart = getQuarterStart(baseDate);
      dueDate.setFullYear(quarterStart.getFullYear(), quarterStart.getMonth(), quarterStart.getDate());
      break;

    case CHECKLIST_FREQUENCIES.YEARLY:
      // Due this year (Jan 1) at defaultDueTime
      const yearStart = getYearStart(baseDate);
      dueDate.setFullYear(yearStart.getFullYear(), yearStart.getMonth(), yearStart.getDate());
      break;

    case CHECKLIST_FREQUENCIES.ONE_TIME:
      // Due today at defaultDueTime
      break;

    default:
      // Default to today
      break;
  }

  return dueDate.toISOString();
};

/**
 * Check if an instance should be created for a template
 * 
 * @param {Object} template - Checklist template
 * @param {Array} existingInstances - Array of existing checklist items for this user
 * @param {Date} today - Today's date (default: new Date())
 * @returns {boolean} - True if instance should be created
 */
export const shouldCreateInstance = (template, existingInstances = [], today = new Date()) => {
  const { frequency, id: templateId } = template;

  // Find existing instances for this template
  const templateInstances = existingInstances.filter(
    item => item.templateId === templateId && !item.completed
  );

  // If there's already an active instance, don't create another
  if (templateInstances.length > 0) {
    return false;
  }

  // Check if instance should be created based on frequency
  switch (frequency) {
    case CHECKLIST_FREQUENCIES.DAILY:
      // Check if instance exists for today
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const hasTodayInstance = existingInstances.some(item => {
        if (item.templateId !== templateId) return false;
        const itemDate = new Date(item.dueDate);
        return itemDate >= todayStart && itemDate <= todayEnd;
      });
      return !hasTodayInstance;

    case CHECKLIST_FREQUENCIES.WEEKLY:
      // Check if instance exists for this week
      const thisWeekStart = getWeekStart(today);
      const hasThisWeekInstance = existingInstances.some(item => {
        if (item.templateId !== templateId) return false;
        const itemDate = new Date(item.dueDate);
        const itemWeekStart = getWeekStart(itemDate);
        return itemWeekStart.getTime() === thisWeekStart.getTime();
      });
      return !hasThisWeekInstance;

    case CHECKLIST_FREQUENCIES.MONTHLY:
      // Check if instance exists for this month
      const thisMonthStart = getMonthStart(today);
      const hasThisMonthInstance = existingInstances.some(item => {
        if (item.templateId !== templateId) return false;
        const itemDate = new Date(item.dueDate);
        const itemMonthStart = getMonthStart(itemDate);
        return itemMonthStart.getTime() === thisMonthStart.getTime();
      });
      return !hasThisMonthInstance;

    case CHECKLIST_FREQUENCIES.QUARTERLY:
      // Check if instance exists for this quarter
      const thisQuarterStart = getQuarterStart(today);
      const hasThisQuarterInstance = existingInstances.some(item => {
        if (item.templateId !== templateId) return false;
        const itemDate = new Date(item.dueDate);
        const itemQuarterStart = getQuarterStart(itemDate);
        return itemQuarterStart.getTime() === thisQuarterStart.getTime();
      });
      return !hasThisQuarterInstance;

    case CHECKLIST_FREQUENCIES.YEARLY:
      // Check if instance exists for this year
      const thisYearStart = getYearStart(today);
      const hasThisYearInstance = existingInstances.some(item => {
        if (item.templateId !== templateId) return false;
        const itemDate = new Date(item.dueDate);
        const itemYearStart = getYearStart(itemDate);
        return itemYearStart.getTime() === thisYearStart.getTime();
      });
      return !hasThisYearInstance;

    case CHECKLIST_FREQUENCIES.ONE_TIME:
      // Check if instance was ever created
      const hasOneTimeInstance = existingInstances.some(item => item.templateId === templateId);
      return !hasOneTimeInstance;

    default:
      return false;
  }
};

export const getInstancePeriodStart = (instance) => {
  if (!instance || !instance.frequency || !instance.dueDate) {
    return null;
  }

  const date = new Date(instance.dueDate);

  switch (instance.frequency) {
    case CHECKLIST_FREQUENCIES.DAILY:
      date.setHours(0, 0, 0, 0);
      return date;

    case CHECKLIST_FREQUENCIES.WEEKLY:
      return getWeekStart(date);

    case CHECKLIST_FREQUENCIES.MONTHLY:
      return getMonthStart(date);

    case CHECKLIST_FREQUENCIES.QUARTERLY:
      return getQuarterStart(date);

    case CHECKLIST_FREQUENCIES.YEARLY:
      return getYearStart(date);

    case CHECKLIST_FREQUENCIES.ONE_TIME:
      date.setHours(0, 0, 0, 0);
      return date;

    default:
      date.setHours(0, 0, 0, 0);
      return date;
  }
};

export const getChecklistInstanceKey = (instance) => {
  const periodStart = getInstancePeriodStart(instance);
  if (!instance || !instance.templateId || !instance.frequency || !periodStart) {
    return null;
  }
  return `${instance.templateId}::${instance.frequency}::${periodStart.toISOString()}`;
};

export const dedupeChecklistInstances = (instances = []) => {
  const groups = instances.reduce((acc, item) => {
    const key = getChecklistInstanceKey(item);
    if (!key) {
      return acc;
    }

    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const uniqueInstances = [];
  const duplicateInstanceIds = [];

  Object.values(groups).forEach((group) => {
    if (group.length === 1) {
      uniqueInstances.push(group[0]);
      return;
    }

    const sortedGroup = [...group].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    uniqueInstances.push(sortedGroup[0]);
    duplicateInstanceIds.push(...sortedGroup.slice(1).map((item) => item.id).filter(Boolean));
  });

  return { uniqueInstances, duplicateInstanceIds };
};

/**
 * Generate checklist instances from templates
 * 
 * @param {string} userId - User ID
 * @param {Array} templates - Array of applicable templates
 * @param {Array} existingInstances - Array of existing checklist items
 * @returns {Promise<Array>} - Array of newly created instances
 */
export const generateChecklistInstances = async (userId, templates, existingInstances = []) => {
  if (!userId || !templates || templates.length === 0) {
    return [];
  }

  const today = new Date();
  const newInstances = [];

  for (const template of templates) {
    // Check if instance should be created
    if (shouldCreateInstance(template, existingInstances, today)) {
      const dueDate = calculateNextDueDate(template, today);
      const nowIso = new Date().toISOString();

      const instanceData = {
        userId,
        title: template.title,
        description: template.description || null,
        category: template.category,
        status: 'pending',
        completed: false,
        dueDate,
        completedAt: null,
        priority: template.priority || 'medium',
        notes: null,
        photos: [],
        createdAt: nowIso,
        updatedAt: nowIso,
        templateId: template.id,
        source: 'osha_generated',
        frequency: template.frequency,
      };

      try {
        const result = await createDocument('checklistItems', instanceData);
        if (!result.error && result.id) {
          const createdInstance = {
            id: result.id,
            ...instanceData,
          };
          newInstances.push(createdInstance);
          existingInstances.push(createdInstance);
        }
      } catch (error) {
        console.error(`Error creating instance for template ${template.id}:`, error);
      }
    }
  }

  return newInstances;
};

export default {
  getWeekStart,
  getMonthStart,
  getQuarterStart,
  getYearStart,
  calculateNextDueDate,
  shouldCreateInstance,
  generateChecklistInstances,
};
