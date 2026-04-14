/**
 * Checklist Template Sync Service
 * 
 * Handles syncing checklist templates from Firestore to local AsyncStorage cache.
 * Can be called from multiple places (login, profile change, manual refresh).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryDocuments, getDocument, updateDocument } from './firestore';
import { getApplicableTemplates } from './checklistFiltering';

const CACHE_KEY_PREFIX = '@checklist_templates_';
const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate hash of user profile for change detection
 * 
 * @param {Object} profile - User business profile
 * @returns {string} - Hash string
 */
const stableSerialize = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `"${key}":${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const hashProfile = (profile) => {
  if (!profile) return '';
  // Stable hash - deterministic object key ordering
  const str = stableSerialize(profile);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

/**
 * Sync templates from Firestore to local cache
 * 
 * @param {string} userId - User ID
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<{templates: Array, fromCache: boolean, error: null}>}
 */
export const syncTemplates = async (userId, forceRefresh = false) => {
  try {
    if (!userId) {
      return { templates: [], fromCache: false, error: { message: 'User ID is required' } };
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

    // Get user profile
    const userResult = await getDocument('users', userId);
    if (userResult.error || !userResult.data) {
      return { templates: [], fromCache: false, businessId: null, error: userResult.error || { message: 'User not found' } };
    }

    const userProfile = userResult.data.businessProfile;
    if (!userProfile) {
      // No business profile set - return empty but no error
      return { templates: [], fromCache: false, businessId: userResult.data?.defaultBusinessId || null, error: null };
    }

    const profileHash = hashProfile(userProfile);

    // Check cache if not forcing refresh
    if (!forceRefresh) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(cacheData.cachedAt).getTime();

          // Cache is valid if:
          // 1. Less than 24 hours old
          // 2. Profile hasn't changed
          if (cacheAge < CACHE_VALIDITY_MS && cacheData.userProfileHash === profileHash) {
            return {
              templates: cacheData.templates || [],
              fromCache: true,
              businessId: userResult.data?.defaultBusinessId || null,
              error: null,
            };
          }
        }
      } catch (cacheError) {
        console.warn('Error reading cache:', cacheError);
        // Continue to fetch from Firestore
      }
    }

    // Fetch from Firestore
    const templatesResult = await queryDocuments('checklistTemplates', [
      { field: 'isActive', operator: '==', value: true }
    ]);

    if (templatesResult.error) {
      // Try to return cached data even if stale
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          return {
            templates: cacheData.templates || [],
            fromCache: true,
            businessId: userResult.data?.defaultBusinessId || null,
            error: templatesResult.error,
          };
        }
      } catch (_cacheError) {
        // Ignore cache error
      }
      return { templates: [], fromCache: false, businessId: userResult.data?.defaultBusinessId || null, error: templatesResult.error };
    }

    // Filter templates by user profile
    const applicableTemplates = getApplicableTemplates(templatesResult.data || [], userProfile);

    // Store in cache
    const cacheData = {
      templates: applicableTemplates,
      cachedAt: new Date().toISOString(),
      userProfileHash: profileHash,
      version: 1,
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (cacheError) {
      console.warn('Error storing cache:', cacheError);
      // Continue even if cache fails
    }

    // Update user's lastTemplateSync
    try {
      const updateResult = await updateDocument('users', userId, {
        'businessProfile.lastTemplateSync': new Date().toISOString(),
      });
      if (updateResult?.error) {
        console.warn('Error updating lastTemplateSync:', updateResult.error);
      }
    } catch (updateError) {
      console.warn('Error updating lastTemplateSync:', updateError);
      // Don't fail the sync if this update fails
    }

    return {
      templates: applicableTemplates,
      fromCache: false,
      businessId: userResult.data?.defaultBusinessId || null,
      error: null,
    };
  } catch (error) {
    console.error('Error syncing templates:', error);
    return { templates: [], fromCache: false, businessId: null, error: { message: error.message || 'Unknown error' } };
  }
};

/**
 * Get cached templates
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of cached templates
 */
export const getCachedTemplates = async (userId) => {
  try {
    if (!userId) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const cacheData = JSON.parse(cached);
      return cacheData.templates || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting cached templates:', error);
    return [];
  }
};

/**
 * Clear template cache (on logout or profile change)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const clearTemplateCache = async (userId) => {
  try {
    if (!userId) return;

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing template cache:', error);
  }
};

/**
 * Check if cache is valid
 * 
 * @param {string} cachedAt - ISO timestamp of cache
 * @param {string} profileHash - Current profile hash
 * @param {string} cachedProfileHash - Cached profile hash
 * @returns {boolean} - True if cache is valid
 */
export const isCacheValid = (cachedAt, profileHash, cachedProfileHash) => {
  if (cachedAt == null || profileHash == null || cachedProfileHash == null) {
    return false;
  }

  const cacheAge = Date.now() - new Date(cachedAt).getTime();
  return cacheAge < CACHE_VALIDITY_MS && profileHash === cachedProfileHash;
};

export default {
  syncTemplates,
  getCachedTemplates,
  clearTemplateCache,
  isCacheValid,
};
