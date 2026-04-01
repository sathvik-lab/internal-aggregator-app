/**
 * OSHA Checklist Converter
 *
 * Transforms extracted tasks (input-schema format) into ChecklistTemplate
 * documents (Firestore schema). Validates enums against checklistConstants.
 */

import {
  TRUCK_TYPES,
  FOOD_TYPES,
  BUSINESS_TYPES,
  COMPLIANCE_AREAS,
  US_STATES,
  CHECKLIST_FREQUENCIES,
} from '../constants/checklistConstants.js';

const VALID_TRUCK_TYPES = Object.values(TRUCK_TYPES);
const VALID_FOOD_TYPES = Object.values(FOOD_TYPES);
const VALID_BUSINESS_TYPES = Object.values(BUSINESS_TYPES);
const VALID_COMPLIANCE_AREAS = Object.values(COMPLIANCE_AREAS);
const VALID_FREQUENCIES = Object.values(CHECKLIST_FREQUENCIES);
const VALID_CATEGORIES = [
  'Food Safety',
  'Fire Safety',
  'Vehicle Safety',
  'Worker Safety',
  'Environmental',
];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const DEFAULT_APPLICABLE_TO = {
  truckTypes: null,
  foodTypes: null,
  businessTypes: null,
  locations: { states: null, cities: null },
  complianceAreas: null,
};

const HHMM_REGEX = /^\d{1,2}:\d{2}$/;

/**
 * Create slug from title and optional regulation number.
 *
 * @param {string} title
 * @param {string|null} regulationNumber
 * @param {number} index - For deduplication
 * @returns {string}
 */
function createSlug(title, regulationNumber, index = 0) {
  const base = [regulationNumber, title]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return index > 0 ? `${base}-${index}` : base;
}

/**
 * Validate and filter array against allowed values.
 *
 * @param {Array|null} arr
 * @param {string[]} allowed
 * @returns {Array|null}
 */
function filterEnumArray(arr, allowed) {
  if (arr == null) return null;
  if (!Array.isArray(arr)) return null;
  const filtered = arr.filter((v) => typeof v === 'string' && allowed.includes(v));
  return filtered.length > 0 ? filtered : null;
}

/**
 * Validate applicableTo object.
 *
 * @param {object|null} applicableTo
 * @returns {object}
 */
function normalizeApplicableTo(applicableTo) {
  if (applicableTo == null) return { ...DEFAULT_APPLICABLE_TO };

  const result = { ...DEFAULT_APPLICABLE_TO };

  result.truckTypes = filterEnumArray(applicableTo.truckTypes, VALID_TRUCK_TYPES);
  result.foodTypes = filterEnumArray(applicableTo.foodTypes, VALID_FOOD_TYPES);
  result.businessTypes = filterEnumArray(
    applicableTo.businessTypes,
    VALID_BUSINESS_TYPES
  );
  result.complianceAreas = filterEnumArray(
    applicableTo.complianceAreas,
    VALID_COMPLIANCE_AREAS
  );

  if (applicableTo.locations && typeof applicableTo.locations === 'object') {
    const loc = applicableTo.locations;
    const states =
      loc.states != null && Array.isArray(loc.states)
        ? loc.states.filter((s) => typeof s === 'string' && US_STATES.includes(s))
        : null;
    const cities =
      loc.cities != null && Array.isArray(loc.cities)
        ? loc.cities.filter((c) => typeof c === 'string')
        : null;
    result.locations = {
      states: states && states.length > 0 ? states : null,
      cities: cities && cities.length > 0 ? cities : null,
    };
  }

  return result;
}

/**
 * Ensure HH:mm format for defaultDueTime.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeDefaultDueTime(value) {
  if (typeof value !== 'string') return '09:00';
  const trimmed = value.trim();
  if (HHMM_REGEX.test(trimmed)) return trimmed;
  // Try to parse "9:00" or "09:00"
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return '09:00';
}

/**
 * Transform a single extracted task to ChecklistTemplate.
 *
 * @param {object} task - Extracted task (input-schema format)
 * @param {object} options
 * @param {string|null} options.regulationNumber - From parser
 * @param {string|null} options.url - From parser
 * @param {number} options.index - For slug deduplication
 * @param {boolean} options.forFirestore - Include createdAt/updatedAt placeholders
 * @returns {object|null} ChecklistTemplate or null if invalid
 */
export function convertToChecklistTemplate(task, options = {}) {
  const {
    regulationNumber = null,
    url = null,
    index = 0,
    forFirestore = false,
  } = options;

  if (!task || typeof task !== 'object') return null;

  const title = typeof task.title === 'string' ? task.title.trim() : null;
  const description =
    typeof task.description === 'string' ? task.description.trim() : null;

  if (!title || !description) return null;

  const category = VALID_CATEGORIES.includes(task.category)
    ? task.category
    : 'Worker Safety';
  const priority = VALID_PRIORITIES.includes(task.priority)
    ? task.priority
    : 'medium';
  const frequency = VALID_FREQUENCIES.includes(task.frequency)
    ? task.frequency
    : 'daily';
  const defaultDueTime = normalizeDefaultDueTime(task.defaultDueTime ?? '09:00');

  const applicableTo = normalizeApplicableTo(task.applicableTo);

  let regulationReference = task.regulationReference ?? null;
  if (regulationReference && typeof regulationReference === 'object') {
    regulationReference = {
      regulationNumber:
        regulationReference.regulationNumber ?? regulationNumber ?? '',
      url: regulationReference.url ?? url ?? '',
      section: regulationReference.section ?? '',
    };
  } else if (regulationNumber && url) {
    regulationReference = {
      regulationNumber,
      url,
      section: title,
    };
  }

  const id = createSlug(title, regulationNumber, index);

  const template = {
    id,
    title,
    description,
    category,
    priority,
    applicableTo,
    frequency,
    defaultDueTime,
    startDate: task.startDate ?? null,
    endDate: task.endDate ?? null,
    source: 'osha_generated',
    regulationReference,
    version: typeof task.version === 'number' ? task.version : 1,
    isActive: task.isActive !== false,
  };

  if (forFirestore) {
    template.createdAt = null; // Caller should use FieldValue.serverTimestamp()
    template.updatedAt = null;
  }

  return template;
}

/**
 * Convert and deduplicate multiple extracted tasks.
 *
 * @param {Array<object>} tasks
 * @param {object} parserContext - { regulationNumber, url }
 * @param {boolean} forFirestore
 * @returns {Array<object>}
 */
export function convertExtractedTasks(tasks, parserContext = {}, forFirestore = false) {
  if (!Array.isArray(tasks)) return [];

  const seen = new Set();
  const templates = [];

  tasks.forEach((task, i) => {
    const t = convertToChecklistTemplate(task, {
      ...parserContext,
      index: i,
      forFirestore,
    });
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      templates.push(t);
    }
  });

  return templates;
}

export default { convertToChecklistTemplate, convertExtractedTasks };
