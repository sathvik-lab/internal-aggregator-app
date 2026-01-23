/**
 * Checklist Constants
 * 
 * Constants and enums for checklist template system, business profiles, and filtering.
 */

// Truck Types
export const TRUCK_TYPES = {
  REFRIGERATED: 'refrigerated',
  FOOD_TRUCK: 'food_truck',
  FLATBED: 'flatbed',
  TANKER: 'tanker',
  DRY_VAN: 'dry_van',
};

// Food Types
export const FOOD_TYPES = {
  PERISHABLE: 'perishable',
  FROZEN: 'frozen',
  PREPARED: 'prepared',
  DRY_GOODS: 'dry_goods',
  BEVERAGES: 'beverages',
};

// Business Types
export const BUSINESS_TYPES = {
  FOOD_TRUCK: 'food_truck',
  CATERING: 'catering',
  RESTAURANT: 'restaurant',
  MOBILE_KITCHEN: 'mobile_kitchen',
};

// Compliance Areas
export const COMPLIANCE_AREAS = {
  FOOD_SAFETY: 'food_safety',
  FIRE_SAFETY: 'fire_safety',
  VEHICLE_SAFETY: 'vehicle_safety',
  ENVIRONMENTAL: 'environmental',
  WORKER_SAFETY: 'worker_safety',
};

// US States (two-letter codes)
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// Checklist Frequencies
export const CHECKLIST_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  ONE_TIME: 'one_time',
};

// Display labels for dropdowns
export const TRUCK_TYPE_LABELS = {
  [TRUCK_TYPES.REFRIGERATED]: 'Refrigerated',
  [TRUCK_TYPES.FOOD_TRUCK]: 'Food Truck',
  [TRUCK_TYPES.FLATBED]: 'Flatbed',
  [TRUCK_TYPES.TANKER]: 'Tanker',
  [TRUCK_TYPES.DRY_VAN]: 'Dry Van',
};

export const FOOD_TYPE_LABELS = {
  [FOOD_TYPES.PERISHABLE]: 'Perishable',
  [FOOD_TYPES.FROZEN]: 'Frozen',
  [FOOD_TYPES.PREPARED]: 'Prepared',
  [FOOD_TYPES.DRY_GOODS]: 'Dry Goods',
  [FOOD_TYPES.BEVERAGES]: 'Beverages',
};

export const BUSINESS_TYPE_LABELS = {
  [BUSINESS_TYPES.FOOD_TRUCK]: 'Food Truck',
  [BUSINESS_TYPES.CATERING]: 'Catering',
  [BUSINESS_TYPES.RESTAURANT]: 'Restaurant',
  [BUSINESS_TYPES.MOBILE_KITCHEN]: 'Mobile Kitchen',
};

export const COMPLIANCE_AREA_LABELS = {
  [COMPLIANCE_AREAS.FOOD_SAFETY]: 'Food Safety',
  [COMPLIANCE_AREAS.FIRE_SAFETY]: 'Fire Safety',
  [COMPLIANCE_AREAS.VEHICLE_SAFETY]: 'Vehicle Safety',
  [COMPLIANCE_AREAS.ENVIRONMENTAL]: 'Environmental',
  [COMPLIANCE_AREAS.WORKER_SAFETY]: 'Worker Safety',
};

export const FREQUENCY_LABELS = {
  [CHECKLIST_FREQUENCIES.DAILY]: 'Daily',
  [CHECKLIST_FREQUENCIES.WEEKLY]: 'Weekly',
  [CHECKLIST_FREQUENCIES.MONTHLY]: 'Monthly',
  [CHECKLIST_FREQUENCIES.QUARTERLY]: 'Quarterly',
  [CHECKLIST_FREQUENCIES.YEARLY]: 'Yearly',
  [CHECKLIST_FREQUENCIES.ONE_TIME]: 'One Time',
};

// Export all as single object for convenience
export const CHECKLIST_CONSTANTS = {
  TRUCK_TYPES,
  FOOD_TYPES,
  BUSINESS_TYPES,
  COMPLIANCE_AREAS,
  US_STATES,
  CHECKLIST_FREQUENCIES,
  TRUCK_TYPE_LABELS,
  FOOD_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  COMPLIANCE_AREA_LABELS,
  FREQUENCY_LABELS,
};

export default CHECKLIST_CONSTANTS;
