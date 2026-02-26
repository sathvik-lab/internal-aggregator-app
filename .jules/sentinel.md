## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Generic Async Error Handler Information Leakage

**Vulnerability:** The centralized `handleAsyncOperation` utility was returning the `originalError` object to callers, which could contain stack traces, database internals, or other sensitive metadata from Firebase. This data was then accessible to the UI and potentially exposed to end-users or client-side logging.

**Learning:** Utilities designed for convenience often include raw data for debugging purposes, but if these utilities are used across the entire application, they become a high-impact point for information leakage.

**Prevention:** Centralized error handlers should only return sanitized, user-friendly error codes and messages. Internal error details should be logged server-side or to a secure console, but never returned to the application layers that interact with the UI.
