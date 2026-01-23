/**
 * Checklist Filtering Service
 * 
 * Filters checklist templates based on user business profile criteria.
 * Matches templates to users based on truck type, food type, location, business type, and compliance areas.
 */

/**
 * Check if a single template matches the user's business profile
 * 
 * @param {Object} template - Checklist template with applicableTo metadata
 * @param {Object} userBusinessProfile - User's business profile
 * @returns {boolean} - True if template matches user
 */
export const templateMatchesUser = (template, userBusinessProfile) => {
  if (!template || !template.applicableTo) {
    return false; // Template must have applicableTo metadata
  }

  if (!userBusinessProfile) {
    return false; // User must have business profile
  }

  const { applicableTo } = template;
  const { truckType, foodTypes, location, businessType, complianceAreas } = userBusinessProfile;

  // Check truck type match
  if (applicableTo.truckTypes && applicableTo.truckTypes.length > 0) {
    if (!truckType || !applicableTo.truckTypes.includes(truckType)) {
      return false; // Template doesn't match user's truck type
    }
  }

  // Check food type match (user must have at least one matching)
  if (applicableTo.foodTypes && applicableTo.foodTypes.length > 0) {
    if (!foodTypes || foodTypes.length === 0) {
      return false; // User has no food types
    }
    const hasMatchingFoodType = foodTypes.some(ft => applicableTo.foodTypes.includes(ft));
    if (!hasMatchingFoodType) {
      return false; // User doesn't have any matching food types
    }
  }

  // Check business type match
  if (applicableTo.businessTypes && applicableTo.businessTypes.length > 0) {
    if (!businessType || !applicableTo.businessTypes.includes(businessType)) {
      return false; // Template doesn't match user's business type
    }
  }

  // Check location match (state)
  if (applicableTo.locations?.states && applicableTo.locations.states.length > 0) {
    if (!location?.state || !applicableTo.locations.states.includes(location.state)) {
      return false; // User's state doesn't match
    }
  }

  // Check location match (city) - only if template specifies cities
  if (applicableTo.locations?.cities && applicableTo.locations.cities.length > 0) {
    if (!location?.city || !applicableTo.locations.cities.includes(location.city)) {
      return false; // User's city doesn't match
    }
  }

  // Check compliance area match (user must have at least one matching)
  if (applicableTo.complianceAreas && applicableTo.complianceAreas.length > 0) {
    if (!complianceAreas || complianceAreas.length === 0) {
      return false; // User has no compliance areas
    }
    const hasMatchingArea = complianceAreas.some(ca => applicableTo.complianceAreas.includes(ca));
    if (!hasMatchingArea) {
      return false; // User doesn't have any matching compliance areas
    }
  }

  return true; // All checks passed, template matches user
};

/**
 * Filter array of templates by user business profile
 * 
 * @param {Array} templates - Array of checklist templates
 * @param {Object} userBusinessProfile - User's business profile
 * @returns {Array} - Filtered array of matching templates
 */
export const filterTemplatesByCriteria = (templates, userBusinessProfile) => {
  if (!templates || !Array.isArray(templates)) {
    return [];
  }

  if (!userBusinessProfile) {
    return []; // No profile means no templates
  }

  return templates.filter(template => templateMatchesUser(template, userBusinessProfile));
};

/**
 * Get applicable templates for a user
 * 
 * @param {Array} templates - Array of all checklist templates
 * @param {Object} userBusinessProfile - User's business profile
 * @returns {Array} - Array of templates that match the user
 */
export const getApplicableTemplates = (templates, userBusinessProfile) => {
  return filterTemplatesByCriteria(templates, userBusinessProfile);
};

export default {
  templateMatchesUser,
  filterTemplatesByCriteria,
  getApplicableTemplates,
};
