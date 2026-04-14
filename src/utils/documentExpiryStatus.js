const EXPIRING_SOON_DAYS = 30;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDocumentExpiryStatus = (expiryDate) => {
  const parsed = parseDate(expiryDate);
  if (!parsed) {
    return { label: 'Active', tone: 'neutral' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiringCutoff = new Date(today);
  expiringCutoff.setDate(expiringCutoff.getDate() + EXPIRING_SOON_DAYS);

  if (parsed < today) {
    return { label: 'Expired', tone: 'critical' };
  }

  if (parsed <= expiringCutoff) {
    return { label: 'Expiring soon', tone: 'warning' };
  }

  return { label: 'Active', tone: 'success' };
};

export default {
  getDocumentExpiryStatus,
};
