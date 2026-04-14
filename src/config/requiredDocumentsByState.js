import { DOCUMENT_TYPES } from '../constants/constants';

const REQUIRED_DOCUMENTS_BY_STATE = {
  CA: [
    DOCUMENT_TYPES.PERMIT,
    DOCUMENT_TYPES.FOOD_SAFETY_CERT,
    DOCUMENT_TYPES.INSPECTION_REPORT,
  ],
  TX: [
    DOCUMENT_TYPES.PERMIT,
    DOCUMENT_TYPES.LICENSE,
    DOCUMENT_TYPES.FOOD_SAFETY_CERT,
  ],
  FL: [
    DOCUMENT_TYPES.PERMIT,
    DOCUMENT_TYPES.LICENSE,
    DOCUMENT_TYPES.INSURANCE,
  ],
  default: [
    DOCUMENT_TYPES.PERMIT,
    DOCUMENT_TYPES.LICENSE,
    DOCUMENT_TYPES.FOOD_SAFETY_CERT,
  ],
};

export const getRequiredDocumentsForState = (state) => {
  const normalized = typeof state === 'string' ? state.trim().toUpperCase() : '';
  if (!normalized) {
    return {
      requiredTypes: [],
      fallbackTypes: REQUIRED_DOCUMENTS_BY_STATE.default,
      hasState: false,
      stateKey: null,
    };
  }

  return {
    requiredTypes: REQUIRED_DOCUMENTS_BY_STATE[normalized] || REQUIRED_DOCUMENTS_BY_STATE.default,
    fallbackTypes: REQUIRED_DOCUMENTS_BY_STATE.default,
    hasState: true,
    stateKey: normalized,
  };
};

export default REQUIRED_DOCUMENTS_BY_STATE;
