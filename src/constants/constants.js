/**
 * App-wide Constants
 * 
 * Centralized constants for the compliance document management app.
 * Update these values as the app evolves.
 */

// User roles
export const USER_ROLES = {
  OWNER: 'owner',
  STAFF: 'staff',
};

// Document types
export const DOCUMENT_TYPES = {
  ISO_9001: 'ISO_9001',
  HIPAA: 'HIPAA',
  GDPR: 'GDPR',
  OSHA: 'OSHA',
  FOOD_SAFETY: 'FOOD_SAFETY',
  FIRE_SAFETY: 'FIRE_SAFETY',
  VEHICLE_LICENSE: 'VEHICLE_LICENSE',
  OTHER: 'OTHER',
};

// Checklist statuses
export const CHECKLIST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

// Checklist frequencies
export const CHECKLIST_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
};

// Incident types
export const INCIDENT_TYPES = {
  FOOD_SAFETY: 'food_safety',
  EQUIPMENT_FAILURE: 'equipment_failure',
  INJURY_ACCIDENT: 'injury_accident',
  OTHER: 'other',
};

// Incident severity levels
export const INCIDENT_SEVERITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  SEVERE: 'severe',
};

// Compliance score thresholds
export const COMPLIANCE_SCORE_THRESHOLDS = {
  GOOD: 80,        // Green status
  AT_RISK: 60,     // Yellow status
  NON_COMPLIANT: 0, // Red status
};

// Compliance status labels
export const COMPLIANCE_STATUS = {
  GOOD: 'good',
  AT_RISK: 'at_risk',
  NON_COMPLIANT: 'non_compliant',
};

// Storage paths in Firebase Storage
export const STORAGE_PATHS = {
  DOCUMENTS: 'user_documents',
  PROFILES: 'user_profiles',
  CHECKLIST_PHOTOS: 'checklist_photos',
  INCIDENT_PHOTOS: 'incident_photos',
  CERTIFICATIONS: 'certifications',
  MEDIA_LOGS: 'media_logs',
};

// File upload limits
// NOTE: Must be defined before ERROR_MESSAGES since ERROR_MESSAGES references it
export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,                    // Maximum file size in MB
  MAX_SIZE_BYTES: 10 * 1024 * 1024,  // 10MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY h:mm A',
  ISO: 'YYYY-MM-DD',
  ISO_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'Internal Aggregator App',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
};

// Error messages (user-friendly)
// NOTE: FILE_LIMITS must be defined before this since FILE_TOO_LARGE references it
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_LIMITS.MAX_SIZE_MB}MB limit.`,
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Document uploaded successfully.',
  CHECKLIST_COMPLETED: 'Checklist completed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
};

// Export all constants as a single object for convenience
export const APP_CONSTANTS = {
  USER_ROLES,
  DOCUMENT_TYPES,
  CHECKLIST_STATUS,
  CHECKLIST_FREQUENCY,
  INCIDENT_TYPES,
  INCIDENT_SEVERITY,
  COMPLIANCE_SCORE_THRESHOLDS,
  COMPLIANCE_STATUS,
  STORAGE_PATHS,
  FILE_LIMITS,
  PAGINATION,
  DATE_FORMATS,
  APP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};

export default APP_CONSTANTS;
