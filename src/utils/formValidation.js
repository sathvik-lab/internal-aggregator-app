/**
 * Form Validation Utility
 * 
 * Comprehensive form validation functions with user-friendly error messages.
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true, error: null };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Options: { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial }
 * @returns {{valid: boolean, error: string|null}}
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters long` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true, error: null };
};

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true, error: null };
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {Object} options - Options: { min, max, fieldName }
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateLength = (value, options = {}) => {
  const { min, max, fieldName = 'Field' } = options;

  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const stringValue = String(value);
  const length = stringValue.trim().length;

  if (min !== undefined && length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters long` };
  }

  if (max !== undefined && length > max) {
    return { valid: false, error: `${fieldName} must be no more than ${max} characters long` };
  }

  return { valid: true, error: null };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Options: { minDate, maxDate, fieldName, allowPast, allowFuture }
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, fieldName = 'Date', allowPast = true, allowFuture = true } = options;

  if (!date) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} is not a valid date` };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(dateObj);
  dateToCheck.setHours(0, 0, 0, 0);

  if (!allowPast && dateToCheck < now) {
    return { valid: false, error: `${fieldName} cannot be in the past` };
  }

  if (!allowFuture && dateToCheck > now) {
    return { valid: false, error: `${fieldName} cannot be in the future` };
  }

  if (minDate) {
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    if (dateToCheck < min) {
      return { valid: false, error: `${fieldName} must be after ${min.toLocaleDateString()}` };
    }
  }

  if (maxDate) {
    const max = new Date(maxDate);
    max.setHours(0, 0, 0, 0);
    if (dateToCheck > max) {
      return { valid: false, error: `${fieldName} must be before ${max.toLocaleDateString()}` };
    }
  }

  return { valid: true, error: null };
};

/**
 * Validate number
 * @param {*} value - Value to validate
 * @param {Object} options - Options: { min, max, fieldName, integer }
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, fieldName = 'Number', integer = false } = options;

  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be no more than ${max}` };
  }

  return { valid: true, error: null };
};

/**
 * Validate form with schema
 * @param {Object} formData - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {{valid: boolean, errors: Object}}
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = formData[field];

    // Required validation
    if (rules.required && !validateRequired(value, rules.fieldName || field).valid) {
      errors[field] = validateRequired(value, rules.fieldName || field).error;
      isValid = false;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return;
    }

    // Email validation
    if (rules.email) {
      const emailResult = validateEmail(value);
      if (!emailResult.valid) {
        errors[field] = emailResult.error;
        isValid = false;
        return;
      }
    }

    // Password validation
    if (rules.password) {
      const passwordResult = validatePassword(value, rules.passwordOptions || {});
      if (!passwordResult.valid) {
        errors[field] = passwordResult.error;
        isValid = false;
        return;
      }
    }

    // Length validation
    if (rules.length) {
      const lengthResult = validateLength(value, {
        ...rules.length,
        fieldName: rules.fieldName || field,
      });
      if (!lengthResult.valid) {
        errors[field] = lengthResult.error;
        isValid = false;
        return;
      }
    }

    // Date validation
    if (rules.date) {
      const dateResult = validateDate(value, {
        ...rules.date,
        fieldName: rules.fieldName || field,
      });
      if (!dateResult.valid) {
        errors[field] = dateResult.error;
        isValid = false;
        return;
      }
    }

    // Number validation
    if (rules.number) {
      const numberResult = validateNumber(value, {
        ...rules.number,
        fieldName: rules.fieldName || field,
      });
      if (!numberResult.valid) {
        errors[field] = numberResult.error;
        isValid = false;
        return;
      }
    }

    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value, formData);
      if (customResult !== true && customResult !== null && customResult !== undefined) {
        errors[field] = typeof customResult === 'string' ? customResult : 'Invalid value';
        isValid = false;
        return;
      }
    }
  });

  return { valid: isValid, errors };
};
