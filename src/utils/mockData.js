/**
 * Mock Data for Development and Testing
 * 
 * This file contains comprehensive mock data that matches the Firebase/Firestore data structure.
 * Use this data for development before connecting to Firebase, or for testing purposes.
 * 
 * Data structures match Firebase Auth user structure and Firestore document schemas.
 */

import { DOCUMENT_TYPES, CHECKLIST_STATUS, USER_ROLES } from '../constants/constants';

/**
 * Mock User Data
 * Matches Firebase Auth user structure
 * @typedef {Object} MockUser
 * @property {string} uid - Unique user identifier
 * @property {string} email - User email address
 * @property {string} displayName - User's display name
 * @property {string|null} photoURL - URL to user's profile photo (or null)
 * @property {string} role - User role (owner or staff)
 * @property {string} jobTitle - User's job title for display
 * @property {string} createdAt - ISO timestamp of account creation
 */

export const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'john.doe@company.com',
  displayName: 'John Doe',
  photoURL: null,
  role: USER_ROLES.OWNER,
  jobTitle: 'Fleet Manager',
  createdAt: '2024-01-15T10:30:00.000Z',
};

/**
 * Mock Documents Array
 * Represents compliance documents stored in Firestore
 * @typedef {Object} MockDocument
 * @property {string} id - Document ID (Firestore document ID)
 * @property {string} userId - User ID who owns/uploaded the document
 * @property {string} name - Document name/title
 * @property {string} type - Document type (ISO_9001, HIPAA, GDPR, etc.)
 * @property {number} size - File size in bytes
 * @property {string} uploadDate - ISO timestamp of upload
 * @property {string} category - Document category
 * @property {string} storageUrl - Firebase Storage URL
 * @property {string} mimeType - MIME type of the file
 * @property {string} status - Document status (active, expired, pending_review)
 * @property {string|null} expiryDate - ISO timestamp of expiry (or null)
 * @property {string} description - Document description
 */

export const MOCK_DOCUMENTS = [
  {
    id: 'doc-001',
    userId: MOCK_USER.uid,
    name: 'ISO 9001:2015 Quality Management Certificate',
    type: DOCUMENT_TYPES.ISO_9001,
    size: 2457600, // 2.4 MB
    uploadDate: '2024-01-10T14:20:00.000Z',
    category: 'Certifications',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-001.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    description: 'Current ISO 9001:2015 certification for quality management systems',
  },
  {
    id: 'doc-002',
    userId: MOCK_USER.uid,
    name: 'HIPAA Compliance Policy Document',
    type: DOCUMENT_TYPES.HIPAA,
    size: 1536000, // 1.5 MB
    uploadDate: '2024-01-05T09:15:00.000Z',
    category: 'Policies',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-002.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: null,
    description: 'HIPAA compliance policy and procedures for handling protected health information',
  },
  {
    id: 'doc-003',
    userId: MOCK_USER.uid,
    name: 'GDPR Data Processing Agreement',
    type: DOCUMENT_TYPES.GDPR,
    size: 1024000, // 1 MB
    uploadDate: '2024-01-12T11:45:00.000Z',
    category: 'Legal',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-003.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: null,
    description: 'GDPR data processing agreement with third-party vendors',
  },
  {
    id: 'doc-004',
    userId: MOCK_USER.uid,
    name: 'OSHA Workplace Safety Inspection Report',
    type: DOCUMENT_TYPES.OSHA,
    size: 3072000, // 3 MB
    uploadDate: '2024-01-18T16:30:00.000Z',
    category: 'Safety Reports',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-004.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: '2024-07-18T23:59:59.000Z',
    description: 'Annual OSHA workplace safety inspection report - January 2024',
  },
  {
    id: 'doc-005',
    userId: MOCK_USER.uid,
    name: 'Food Safety Certificate - ServSafe',
    type: DOCUMENT_TYPES.FOOD_SAFETY,
    size: 512000, // 500 KB
    uploadDate: '2024-01-08T13:20:00.000Z',
    category: 'Certifications',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-005.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: '2025-01-08T23:59:59.000Z',
    description: 'ServSafe Food Protection Manager Certification',
  },
  {
    id: 'doc-006',
    userId: MOCK_USER.uid,
    name: 'Fire Safety Inspection Certificate',
    type: DOCUMENT_TYPES.FIRE_SAFETY,
    size: 768000, // 750 KB
    uploadDate: '2024-01-20T10:00:00.000Z',
    category: 'Certifications',
    storageUrl: 'gs://project.appspot.com/user_documents/doc-006.pdf',
    mimeType: 'application/pdf',
    status: 'active',
    expiryDate: '2025-01-20T23:59:59.000Z',
    description: 'Annual fire safety inspection certificate from local fire department',
  },
];

/**
 * Mock Checklist Items Array
 * Represents daily/weekly compliance checklist items
 * @typedef {Object} MockChecklistItem
 * @property {string} id - Checklist item ID
 * @property {string} userId - User ID who owns this checklist
 * @property {string} title - Checklist item title
 * @property {string} description - Detailed description of the task
 * @property {string} dueDate - ISO timestamp of due date
 * @property {boolean} completed - Whether the item is completed
 * @property {string} priority - Priority level (low, medium, high, critical)
 * @property {string} category - Checklist category
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} status - Checklist status (pending, in_progress, completed, overdue)
 * @property {string} frequency - How often this checklist repeats (daily, weekly, monthly)
 * @property {string|null} completedAt - ISO timestamp of completion (or null)
 * @property {string|null} notes - Additional notes about the checklist item
 */

/**
 * Get mock checklist items with dynamically calculated dates
 * This function ensures dates are calculated fresh each time, preventing stale timestamps
 * @returns {Array<MockChecklistItem>} Array of mock checklist items
 */
export const getMockChecklistItems = () => {
  const now = Date.now();
  const oneDay = 86400000; // milliseconds in a day
  const sevenDays = 7 * oneDay;

  return [
    {
      id: 'checklist-001',
      userId: MOCK_USER.uid,
      title: 'Daily Temperature Log - Walk-in Freezer',
      description: 'Record temperature readings from walk-in freezer at 8 AM, 12 PM, and 6 PM',
      dueDate: new Date().toISOString(), // Today - calculated fresh each time
      completed: false,
      priority: 'high',
      category: 'Food Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.PENDING,
      frequency: 'daily',
      completedAt: null,
      notes: null,
    },
    {
      id: 'checklist-002',
      userId: MOCK_USER.uid,
      title: 'Sanitize Food Preparation Surfaces',
      description: 'Clean and sanitize all food preparation surfaces before start of service',
      dueDate: new Date().toISOString(), // Today - calculated fresh each time
      completed: true,
      priority: 'critical',
      category: 'Food Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.COMPLETED,
      frequency: 'daily',
      completedAt: '2024-01-21T07:30:00.000Z',
      notes: 'All surfaces sanitized with approved food-safe sanitizer',
    },
    {
      id: 'checklist-003',
      userId: MOCK_USER.uid,
      title: 'Check Fire Extinguisher Pressure Gauges',
      description: 'Verify all fire extinguishers show pressure in the green zone',
      dueDate: new Date(now + oneDay).toISOString(), // Tomorrow - calculated fresh each time
      completed: false,
      priority: 'high',
      category: 'Fire Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.PENDING,
      frequency: 'weekly',
      completedAt: null,
      notes: null,
    },
    {
      id: 'checklist-004',
      userId: MOCK_USER.uid,
      title: 'Review Employee Training Records',
      description: 'Ensure all employees have completed required compliance training',
      dueDate: '2024-01-25T17:00:00.000Z',
      completed: false,
      priority: 'medium',
      category: 'Compliance',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.IN_PROGRESS,
      frequency: 'monthly',
      completedAt: null,
      notes: '3 employees need to complete HIPAA training',
    },
    {
      id: 'checklist-005',
      userId: MOCK_USER.uid,
      title: 'Inspect Emergency Exit Signs',
      description: 'Verify all emergency exit signs are illuminated and clearly visible',
      dueDate: new Date().toISOString(), // Today - calculated fresh each time
      completed: false,
      priority: 'high',
      category: 'Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.PENDING,
      frequency: 'weekly',
      completedAt: null,
      notes: null,
    },
    {
      id: 'checklist-006',
      userId: MOCK_USER.uid,
      title: 'Update Data Privacy Policy Documentation',
      description: 'Review and update GDPR data privacy policy documentation',
      dueDate: '2024-02-01T17:00:00.000Z',
      completed: false,
      priority: 'medium',
      category: 'Compliance',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.PENDING,
      frequency: 'quarterly',
      completedAt: null,
      notes: null,
    },
    {
      id: 'checklist-007',
      userId: MOCK_USER.uid,
      title: 'Verify First Aid Kit Supplies',
      description: 'Check first aid kit for expired items and restock as needed',
      dueDate: new Date(now + sevenDays).toISOString(), // 7 days from now - calculated fresh each time
      completed: false,
      priority: 'medium',
      category: 'Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.PENDING,
      frequency: 'monthly',
      completedAt: null,
      notes: null,
    },
    {
      id: 'checklist-008',
      userId: MOCK_USER.uid,
      title: 'Conduct Equipment Safety Inspection',
      description: 'Inspect all kitchen equipment for safety compliance and proper operation',
      dueDate: '2024-01-22T17:00:00.000Z',
      completed: false,
      priority: 'high',
      category: 'Safety',
      createdAt: '2024-01-15T08:00:00.000Z',
      status: CHECKLIST_STATUS.IN_PROGRESS,
      frequency: 'monthly',
      completedAt: null,
      notes: 'Scheduled for next Monday morning',
    },
  ];
};

// NOTE: Do NOT export MOCK_CHECKLIST_ITEMS as a constant - it would have stale dates.
// Always use getMockChecklistItems() to get fresh dates each time.

/**
 * Mock Document Categories
 * Categories for organizing compliance documents
 */
export const MOCK_DOCUMENT_CATEGORIES = [
  'Certifications',
  'Policies',
  'Legal',
  'Safety Reports',
  'Training Records',
  'Inspection Reports',
  'Licenses',
  'Insurance',
];

/**
 * Mock Checklist Categories
 * Categories for organizing compliance checklists
 */
export const MOCK_CHECKLIST_CATEGORIES = [
  'Food Safety',
  'Fire Safety',
  'Safety',
  'Compliance',
  'Health & Hygiene',
  'Equipment Maintenance',
  'Training',
  'Documentation',
];

/**
 * Helper function to get mock user by ID
 * @param {string} userId - User ID to retrieve
 * @returns {MockUser|null} Mock user object or null if not found
 */
export const getMockUser = (userId) => {
  if (userId === MOCK_USER.uid) {
    return MOCK_USER;
  }
  return null;
};

/**
 * Helper function to get mock documents by user ID
 * @param {string} userId - User ID to filter documents
 * @returns {MockDocument[]} Array of mock documents
 */
export const getMockDocumentsByUserId = (userId) => {
  return MOCK_DOCUMENTS.filter((doc) => doc.userId === userId);
};

/**
 * Helper function to get mock checklist items by user ID
 * @param {string} userId - User ID to filter checklist items
 * @returns {MockChecklistItem[]} Array of mock checklist items
 */
export const getMockChecklistItemsByUserId = (userId) => {
  return getMockChecklistItems().filter((item) => item.userId === userId);
};

/**
 * Helper function to get mock document by ID
 * @param {string} docId - Document ID to retrieve
 * @returns {MockDocument|undefined} Mock document or undefined if not found
 */
export const getMockDocumentById = (docId) => {
  return MOCK_DOCUMENTS.find((doc) => doc.id === docId);
};

/**
 * Helper function to get mock checklist item by ID
 * @param {string} itemId - Checklist item ID to retrieve
 * @returns {MockChecklistItem|undefined} Mock checklist item or undefined if not found
 */
export const getMockChecklistItemById = (itemId) => {
  return getMockChecklistItems().find((item) => item.id === itemId);
};

/**
 * Get all mock data as a single object
 * NOTE: This function returns fresh data each time, ensuring checklist items have current dates.
 * Use this instead of a constant to avoid stale timestamps.
 * @returns {Object} Object containing all mock data
 */
export const getMockData = () => {
  return {
    user: MOCK_USER,
    documents: MOCK_DOCUMENTS,
    checklistItems: getMockChecklistItems(), // Fresh dates each time
    documentCategories: MOCK_DOCUMENT_CATEGORIES,
    checklistCategories: MOCK_CHECKLIST_CATEGORIES,
  };
};

// Export as constant for backward compatibility (but checklistItems will have stale dates)
// Prefer using getMockData() for fresh dates
export const MOCK_DATA = {
  user: MOCK_USER,
  documents: MOCK_DOCUMENTS,
  // checklistItems intentionally omitted - use getMockChecklistItems() for fresh dates
  documentCategories: MOCK_DOCUMENT_CATEGORIES,
  checklistCategories: MOCK_CHECKLIST_CATEGORIES,
};

// Default export - same as MOCK_DATA (without checklistItems to avoid stale dates)
// For fresh checklist items, use getMockChecklistItems() or getMockData()
export default MOCK_DATA;
