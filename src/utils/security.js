/**
 * Security Utilities
 *
 * Functions for sanitizing inputs and protecting against common vulnerabilities.
 */

/**
 * Sanitize a file name to prevent path traversal and other injection attacks.
 * Removes characters like ../, /, \, and other special characters.
 *
 * @param {string} fileName - The file name to sanitize
 * @returns {string} The sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  // Remove any path traversal patterns (../ or ..\)
  // and any directory separators (/ or \)
  // and other potentially dangerous characters
  // We only allow alphanumeric, spaces, underscores, and hyphens
  const sanitized = fileName
    .replace(/(\.\.[\/\\])/g, '') // Remove ../ or ..\
    .replace(/[\/\\]/g, '')       // Remove any remaining / or \
    .replace(/[^a-zA-Z0-9 _-]/g, '') // Allow only alphanumeric, space, _, -
    .trim();

  return sanitized;
};
