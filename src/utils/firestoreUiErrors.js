import { getErrorMessage, isNetworkError } from './errorHandler';

const DEFAULT_LOAD = 'Could not load data. Try again.';

/**
 * User-facing copy when Firestore read / listener fails.
 * Online-first: assumes server unreachable or request failed; retry when connection stable.
 *
 * @param {Error|Object|null} error - Service/Firestore shape `{ code?, message? }`
 * @param {{ staleDataHint?: boolean }} [options] - If true, note UI may still show older data (e.g. dashboard partial refresh).
 * @returns {string}
 */
export const getFirestoreLoadUserMessage = (error, options = {}) => {
  const { staleDataHint = false } = options;
  if (!error) return DEFAULT_LOAD;
  if (isNetworkError(error)) {
    if (staleDataHint) {
      return 'Could not refresh from the server. Check your connection and try again. What you see may be out of date.';
    }
    return 'Could not reach the server. Check your connection and try again.';
  }
  return getErrorMessage(error, DEFAULT_LOAD);
};
