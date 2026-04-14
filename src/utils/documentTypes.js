import { DOCUMENT_TYPES, STORAGE_PATHS } from '../constants/constants';

export const DOCUMENT_FILTERS = [
  'All',
  'Permit',
  'License',
  'Food Safety Cert',
  'Fire Safety',
  'Insurance',
  'Inspection Report',
  'Other',
];

export const DOCUMENT_TYPE_OPTIONS = [
  {
    value: DOCUMENT_TYPES.PERMIT,
    label: 'Permit',
    filterLabel: 'Permit',
    storagePath: STORAGE_PATHS.DOCUMENT_PERMITS,
  },
  {
    value: DOCUMENT_TYPES.LICENSE,
    label: 'License',
    filterLabel: 'License',
    storagePath: STORAGE_PATHS.DOCUMENT_LICENSES,
  },
  {
    value: DOCUMENT_TYPES.FOOD_SAFETY_CERT,
    label: 'Food Safety Cert',
    filterLabel: 'Food Safety Cert',
    storagePath: STORAGE_PATHS.DOCUMENT_FOOD_SAFETY_CERTS,
  },
  {
    value: DOCUMENT_TYPES.FIRE_SAFETY,
    label: 'Fire Safety',
    filterLabel: 'Fire Safety',
    storagePath: STORAGE_PATHS.DOCUMENT_FIRE_SAFETY,
  },
  {
    value: DOCUMENT_TYPES.INSURANCE,
    label: 'Insurance',
    filterLabel: 'Insurance',
    storagePath: STORAGE_PATHS.DOCUMENT_INSURANCE,
  },
  {
    value: DOCUMENT_TYPES.INSPECTION_REPORT,
    label: 'Inspection Report',
    filterLabel: 'Inspection Report',
    storagePath: STORAGE_PATHS.DOCUMENT_INSPECTION_REPORTS,
  },
  {
    value: DOCUMENT_TYPES.OTHER,
    label: 'Other',
    filterLabel: 'Other',
    storagePath: STORAGE_PATHS.DOCUMENT_OTHER,
  },
];

// Backward compatibility for older Firestore values and category labels.
const LEGACY_TYPE_TO_FILTER = {
  [DOCUMENT_TYPES.FOOD_SAFETY]: 'Food Safety Cert',
  [DOCUMENT_TYPES.FIRE_SAFETY]: 'Fire Safety',
  [DOCUMENT_TYPES.VEHICLE_LICENSE]: 'License',
  [DOCUMENT_TYPES.OSHA]: 'Inspection Report',
  [DOCUMENT_TYPES.ISO_9001]: 'Permit',
  [DOCUMENT_TYPES.HIPAA]: 'License',
  [DOCUMENT_TYPES.GDPR]: 'Insurance',
};

const LEGACY_CATEGORY_TO_FILTER = {
  Certifications: 'Food Safety Cert',
  Policies: 'Permit',
  Legal: 'License',
  'Safety Reports': 'Inspection Report',
};

const FILTER_TO_TYPE = {
  Permit: DOCUMENT_TYPES.PERMIT,
  License: DOCUMENT_TYPES.LICENSE,
  'Food Safety Cert': DOCUMENT_TYPES.FOOD_SAFETY_CERT,
  'Fire Safety': DOCUMENT_TYPES.FIRE_SAFETY,
  Insurance: DOCUMENT_TYPES.INSURANCE,
  'Inspection Report': DOCUMENT_TYPES.INSPECTION_REPORT,
  Other: DOCUMENT_TYPES.OTHER,
};

export const getDocumentTypeOption = (type) =>
  DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type) || DOCUMENT_TYPE_OPTIONS.at(-1);

export const getDocumentFilterLabel = (document = {}) => {
  if (document.category && DOCUMENT_FILTERS.includes(document.category)) {
    return document.category;
  }

  if (document.type && LEGACY_TYPE_TO_FILTER[document.type]) {
    return LEGACY_TYPE_TO_FILTER[document.type];
  }

  if (document.category && LEGACY_CATEGORY_TO_FILTER[document.category]) {
    return LEGACY_CATEGORY_TO_FILTER[document.category];
  }

  return 'Other';
};

export const getDocumentDisplayLabel = (document = {}) => getDocumentFilterLabel(document);

export const getDocumentTypeValue = (document = {}) => {
  if (document.type && DOCUMENT_TYPE_OPTIONS.some((option) => option.value === document.type)) {
    return document.type;
  }

  const filterLabel = getDocumentFilterLabel(document);
  return FILTER_TO_TYPE[filterLabel] || DOCUMENT_TYPES.OTHER;
};

export const getDocumentStorageBasePath = (type) => getDocumentTypeOption(type).storagePath;

const EXPIRING_WINDOW_DAYS = 30;

export const parseExpiryDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDocumentExpiryStatus = (document = {}) => {
  const expiryDate = parseExpiryDate(document.expiryDate);
  if (!expiryDate) return 'none';

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const expiringCutoff = new Date(todayEnd.getTime() + EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  if (expiryDate < todayStart) {
    return 'expired';
  }

  if (expiryDate >= todayStart && expiryDate <= expiringCutoff) {
    return 'expiring_soon';
  }

  return 'valid';
};

export const getDocumentExpiryBadge = (document = {}) => {
  const status = getDocumentExpiryStatus(document);
  if (status === 'expired') {
    return { label: 'Expired', color: '#DC2626' };
  }
  if (status === 'expiring_soon') {
    return { label: 'Expiring soon', color: '#F59E0B' };
  }
  return null;
};

export const getDocumentExpiryLabel = (expiryDateValue) => {
  const expiryDate = parseExpiryDate(expiryDateValue);
  if (!expiryDate) return 'No expiry date';
  return expiryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const buildDocumentMetadata = ({
  selectedType,
  fileName,
  selectedFile,
  notes,
  userId,
  businessId = null,
  uploadUrl,
  storagePath,
  expiryDate,
}) => ({
  userId,
  ...(businessId ? { businessId } : {}),
  name: fileName,
  type: selectedType,
  category: getDocumentTypeOption(selectedType).filterLabel,
  size: selectedFile.size,
  notes: notes.trim() || null,
  mimeType: selectedFile.type || 'application/pdf',
  storageUrl: uploadUrl,
  storagePath,
  expiryDate: expiryDate || null,
  uploadDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: 'active',
});
