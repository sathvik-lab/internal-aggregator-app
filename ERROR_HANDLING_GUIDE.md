# Error Handling & Edge Cases Guide

## Overview
This document outlines the comprehensive error handling implementation across the Internal Aggregator App. All error scenarios are handled gracefully with user-friendly messages and proper fallbacks.

## Error Handling Utilities

### `src/utils/errorHandler.js`
Central error handling utility providing:

1. **Network Detection**
   - `checkNetworkConnection()` - Checks if device has internet connectivity
   - `isNetworkError()` - Detects network-related errors

2. **Timeout Handling**
   - `createTimeout()` - Creates timeout promises
   - `withTimeout()` - Wraps async operations with timeout (default: 30s)
   - `isTimeoutError()` - Detects timeout errors

3. **Error Message Mapping**
   - `getErrorMessage()` - Converts technical errors to user-friendly messages
   - Maps Firebase error codes to readable messages
   - Handles network, timeout, permission, and validation errors

4. **Async Operation Wrapper**
   - `handleAsyncOperation()` - Comprehensive wrapper for async operations
   - Includes network check, timeout, and error handling
   - Returns consistent `{data, error}` format

5. **Data Validation**
   - `validateData()` - Validates data structure against schema
   - `safeGet()` - Safe value getter with null/undefined checks
   - `safeGetAsync()` - Safe async value getter

6. **Retry Logic**
   - `retryAsyncOperation()` - Retries failed operations with exponential backoff
   - Configurable max retries, delays, and backoff multiplier

### `src/utils/formValidation.js`
Form validation utilities:

1. **Email Validation** - `validateEmail()`
2. **Password Validation** - `validatePassword()` with strength requirements
3. **Required Field Validation** - `validateRequired()`
4. **Length Validation** - `validateLength()` with min/max
5. **Date Validation** - `validateDate()` with range and past/future checks
6. **Number Validation** - `validateNumber()` with min/max and integer checks
7. **Form Schema Validation** - `validateForm()` for complete form validation

## Service-Level Error Handling

### Firebase Services

#### Firestore Service (`src/services/firestore.js`)
All functions now include:
- ✅ Input validation (type checking, required fields)
- ✅ Database availability checks
- ✅ Network error detection
- ✅ Timeout handling (30s default)
- ✅ User-friendly error messages
- ✅ Null/undefined safety for timestamps
- ✅ Graceful degradation for missing indexes

**Functions Enhanced:**
- `createDocument()` - Full validation and error handling
- `getDocument()` - Safe data retrieval with null checks
- `updateDocument()` - Input validation and error handling
- `deleteDocument()` - Safe deletion with error handling
- `queryDocuments()` - Comprehensive query error handling
- `setupRealtimeListener()` - Listener error handling

#### Storage Service (`src/services/storage.js`)
All functions now include:
- ✅ File validation (size, type, URI)
- ✅ Storage availability checks
- ✅ Network error detection
- ✅ Timeout handling (60s for uploads)
- ✅ Progress callback error handling
- ✅ User-friendly error messages

**Functions Enhanced:**
- `uploadFile()` - Complete file validation and error handling
- `downloadFile()` - Safe download with error handling
- `deleteFile()` - Safe deletion with error handling
- `getFileURL()` - URL retrieval with error handling
- `getFileMetadata()` - Metadata retrieval with error handling

#### Auth Service (`src/services/auth.js`)
Already includes:
- ✅ Firebase error code mapping
- ✅ User-friendly error messages
- ✅ Try-catch blocks

## Error Types Handled

### 1. Network Errors
- **Detection**: `isNetworkError()` checks error codes and messages
- **Handling**: Returns user-friendly "Network error" message
- **Recovery**: Suggests checking connection

### 2. Timeout Errors
- **Detection**: `isTimeoutError()` checks for timeout codes
- **Handling**: Returns "Request timed out" message
- **Recovery**: Suggests retrying

### 3. Permission Errors
- **Detection**: `isPermissionError()` checks for auth/unauthorized codes
- **Handling**: Returns "Permission denied" message
- **Recovery**: Suggests checking permissions

### 4. Validation Errors
- **Detection**: Input validation before operations
- **Handling**: Returns specific field-level error messages
- **Recovery**: Shows what needs to be fixed

### 5. Invalid Data Errors
- **Detection**: Type checking and schema validation
- **Handling**: Returns "Invalid data" with specific details
- **Recovery**: Shows expected format

### 6. Null/Undefined Errors
- **Detection**: Safe getters and optional chaining
- **Handling**: Returns default values or null
- **Recovery**: Graceful degradation

## Component-Level Error Handling

### Best Practices

1. **Always use try-catch for async operations**
```javascript
try {
  const result = await someAsyncOperation();
  if (result.error) {
    // Handle error
    return;
  }
  // Use result.data
} catch (error) {
  // Handle unexpected error
}
```

2. **Check for null/undefined before accessing properties**
```javascript
const value = safeGet(() => data?.property?.nested, defaultValue);
```

3. **Use error handler utilities**
```javascript
import { handleAsyncOperation, getErrorMessage } from '../utils/errorHandler';

const result = await handleAsyncOperation(
  async () => {
    return await someOperation();
  },
  {
    timeout: 30000,
    checkNetwork: true,
    defaultMessage: 'Operation failed',
  }
);

if (result.error) {
  showError(getErrorMessage(result.error));
}
```

4. **Validate forms before submission**
```javascript
import { validateForm } from '../utils/formValidation';

const schema = {
  email: { required: true, email: true },
  password: { required: true, password: true, passwordOptions: { minLength: 6 } },
};

const { valid, errors } = validateForm(formData, schema);
if (!valid) {
  // Display errors
  return;
}
```

## Error Display Components

### ErrorMessage Component
Located at `src/components/common/ErrorMessage.js`:
- Displays error messages with icon
- Includes retry button
- Supports full-screen variant
- Accessible with proper ARIA labels

### Usage Example
```javascript
import ErrorMessage from '../components/common/ErrorMessage';

{error && (
  <ErrorMessage
    message={error.message}
    onRetry={() => handleRetry()}
    fullScreen={false}
  />
)}
```

## Empty State Handling

### EmptyState Component
Located at `src/components/common/EmptyState.js`:
- Displays when no data is available
- Shows helpful message and icon
- Optional action button
- Accessible with proper roles

### Usage Example
```javascript
import EmptyState from '../components/common/EmptyState';

{data.length === 0 && !loading && (
  <EmptyState
    icon="inbox-outline"
    title="No Documents"
    message="You haven't uploaded any documents yet."
    showAction={true}
    actionLabel="Upload Document"
    onAction={() => handleUpload()}
  />
)}
```

## Testing Error Scenarios

### Network Errors
1. Turn off device internet
2. Attempt any data operation
3. Verify user-friendly error message appears
4. Verify retry option is available

### Timeout Errors
1. Simulate slow network (throttle connection)
2. Attempt operation that takes > 30s
3. Verify timeout error message appears
4. Verify retry option works

### Invalid Data
1. Submit form with invalid data
2. Verify field-level error messages appear
3. Verify form doesn't submit
4. Verify errors clear on correction

### Null/Undefined Data
1. Access nested properties that may be null
2. Verify no crashes occur
3. Verify default values are used
4. Verify UI handles missing data gracefully

## Error Recovery Strategies

1. **Automatic Retry**: For transient errors (network, timeout)
2. **User Retry**: Provide retry button for user-initiated retry
3. **Graceful Degradation**: Show cached data or empty state
4. **Offline Support**: Use Firestore offline persistence
5. **Error Logging**: Log errors for debugging (in development)

## Common Error Messages

All error messages are user-friendly and actionable:

- **Network**: "Network error. Please check your connection."
- **Timeout**: "Request timed out. Please try again."
- **Permission**: "You do not have permission to perform this action."
- **Validation**: Field-specific messages (e.g., "Email is required")
- **File**: "File size exceeds 10MB limit."
- **Generic**: "An error occurred. Please try again."

## Future Enhancements

1. **Error Analytics**: Track error frequency and types
2. **Offline Queue**: Queue operations when offline, sync when online
3. **Error Boundaries**: React error boundaries for component-level errors
4. **Retry Policies**: Configurable retry policies per operation type
5. **Error Reporting**: Integration with error reporting service (Sentry, etc.)
