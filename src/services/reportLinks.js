import Constants from 'expo-constants';
import { getFirebaseAuth } from './firebase';

const REGION = 'us-central1';

const getFunctionsBaseUrl = () => {
  const projectId = Constants.expoConfig?.extra?.firebaseProjectId;
  if (!projectId) {
    return null;
  }
  return `https://${REGION}-${projectId}.cloudfunctions.net`;
};

const getFriendlyErrorMessage = (errorCode) => {
  const map = {
    'missing-auth-token': 'Please sign in again to generate a link.',
    'cross-user-request-denied': 'You can only generate links for your own account.',
    'invalid-report-id': 'Invalid report link. Try generating it again.',
    'report-not-found': 'This report link no longer exists.',
    internal: 'Something went wrong. Please try again.',
  };
  return map[errorCode] || 'Unable to process request right now.';
};

const callReportFunction = async (endpoint, body) => {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    return {
      data: null,
      error: {
        code: 'auth/unauthenticated',
        message: 'You must be signed in to generate report links.',
      },
    };
  }

  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) {
    return {
      data: null,
      error: {
        code: 'config/missing-project-id',
        message: 'Report links are unavailable due to app configuration.',
      },
    };
  }

  try {
    const idToken = await user.getIdToken(true);
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        data: null,
        error: {
          code: payload?.error || `http-${response.status}`,
          message: getFriendlyErrorMessage(payload?.error),
        },
      };
    }

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: error?.code || 'network',
        message: 'Network error while contacting report service. Please try again.',
      },
    };
  }
};

export const generateShareableReportLink = async ({ startDate = null, endDate = null, ttlHours = 48, format = 'pdf' } = {}) => (
  callReportFunction('generateSecureReadinessReport', {
    startDate,
    endDate,
    ttlHours,
    format,
  })
);

export const revokeShareableReportLink = async (reportId) => {
  if (!reportId) {
    return {
      data: null,
      error: {
        code: 'invalid-report-id',
        message: 'Report ID is required.',
      },
    };
  }

  return callReportFunction('revokeSecureReadinessReport', { reportId });
};

export default {
  generateShareableReportLink,
  revokeShareableReportLink,
};
