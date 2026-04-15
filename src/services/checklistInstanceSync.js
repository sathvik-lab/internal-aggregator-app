/**
 * Checklist Instance Sync Service
 * 
 * Handles syncing user's checklist instances (items) from Firestore.
 * Uses real-time listeners for active items, cache for completed items.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryDocuments, setupRealtimeListener, deleteDocument } from './firestore';
import { generateChecklistInstances, dedupeChecklistInstances } from './checklistScheduling';

const INSTANCES_CACHE_KEY_PREFIX = '@checklist_instances_';
const COMPLETED_CACHE_KEY_PREFIX = '@checklist_completed_';

/**
 * Sync and generate checklist instances
 * 
 * @param {string} userId - User ID
 * @param {Array} templates - Applicable templates
 * @returns {Promise<{items: Array, error: null}>}
 */
export const syncInstances = async (userId, templates, options = {}) => {
  try {
    if (!userId) {
      return { items: [], error: { message: 'User ID is required' } };
    }

    if (!templates || templates.length === 0) {
      return { items: [], error: null };
    }

    // Get existing active instances
    const businessId = options?.businessId || null;
    const activeConditions = businessId
      ? [
          { field: 'businessId', operator: '==', value: businessId },
          { field: 'completed', operator: '==', value: false },
        ]
      : [
          { field: 'userId', operator: '==', value: userId },
          { field: 'completed', operator: '==', value: false },
        ];
    const existingResult = await queryDocuments('checklistItems', activeConditions);

    if (existingResult.error) {
      return { items: [], error: existingResult.error };
    }

    const existingInstances = existingResult.data || [];
    const { uniqueInstances, duplicateInstanceIds } = dedupeChecklistInstances(existingInstances);

    if (duplicateInstanceIds.length > 0) {
      await Promise.all(duplicateInstanceIds.map(async (duplicateId) => {
        const { error: deleteError } = await deleteDocument('checklistItems', duplicateId);
        if (deleteError) {
          console.warn('Failed to remove duplicate checklist instance', duplicateId, deleteError);
        }
      }));
    }

    // Generate missing instances from templates using deduped active instances
    const newInstances = await generateChecklistInstances(
      userId,
      templates,
      uniqueInstances,
      { businessId }
    );

    // Combine deduped existing + new
    const allItems = [...uniqueInstances, ...newInstances];

    // Cache active items
    try {
      const cacheKey = `${INSTANCES_CACHE_KEY_PREFIX}${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        items: allItems,
        cachedAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
      }));
    } catch (cacheError) {
      console.warn('Error caching instances:', cacheError);
      // Continue even if cache fails
    }

    return { items: allItems, error: null };
  } catch (error) {
    console.error('Error syncing instances:', error);
    return { items: [], error: { message: error.message || 'Unknown error' } };
  }
};

/**
 * Set up real-time listener for active checklist items
 * 
 * @param {string} userId - User ID
 * @param {Function} callback - Callback when items change
 * @returns {Function} Unsubscribe function
 */
export const setupInstancesListener = (userId, callback) => {
  if (!userId || !callback) {
    console.warn('setupInstancesListener: userId and callback are required');
    return () => {}; // Return no-op unsubscribe
  }

  try {
    const unsubscribe = setupRealtimeListener(
      'checklistItems',
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'completed', operator: '==', value: false }
      ],
      async (items, listenerError) => {
        if (listenerError) {
          callback([], listenerError);
          return;
        }

        // Update cache
        try {
          const cacheKey = `${INSTANCES_CACHE_KEY_PREFIX}${userId}`;
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            items: items || [],
            cachedAt: new Date().toISOString(),
            lastSync: new Date().toISOString(),
          }));
        } catch (cacheError) {
          console.warn('Error updating instance cache:', cacheError);
        }

        callback(items || [], null);
      },
      { orderBy: { field: 'dueDate', direction: 'asc' } }
    );

    return typeof unsubscribe === 'function' ? unsubscribe : () => {};
  } catch (error) {
    console.error('Error setting up instances listener:', error);
    callback([], error);
    return () => {}; // Return no-op unsubscribe
  }
};

/**
 * Get cached instances
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of cached instances
 */
export const getCachedInstances = async (userId) => {
  try {
    if (!userId) return [];

    const cacheKey = `${INSTANCES_CACHE_KEY_PREFIX}${userId}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const cacheData = JSON.parse(cached);
      return cacheData.items || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting cached instances:', error);
    return [];
  }
};

/**
 * Cache instances locally
 * 
 * @param {string} userId - User ID
 * @param {Array} items - Checklist items to cache
 * @returns {Promise<void>}
 */
export const cacheInstances = async (userId, items) => {
  try {
    if (!userId) return;

    const cacheKey = `${INSTANCES_CACHE_KEY_PREFIX}${userId}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      items: items || [],
      cachedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error caching instances:', error);
  }
};

/**
 * Clear instance cache
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const clearInstanceCache = async (userId) => {
  try {
    if (!userId) return;

    const instancesKey = `${INSTANCES_CACHE_KEY_PREFIX}${userId}`;
    const completedKey = `${COMPLETED_CACHE_KEY_PREFIX}${userId}`;
    
    await AsyncStorage.removeItem(instancesKey);
    await AsyncStorage.removeItem(completedKey);
  } catch (error) {
    console.error('Error clearing instance cache:', error);
  }
};

export default {
  syncInstances,
  setupInstancesListener,
  getCachedInstances,
  cacheInstances,
  clearInstanceCache,
};
