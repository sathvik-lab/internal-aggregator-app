## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-22 - Information Leakage via Error Objects

**Vulnerability:** The 'handleAsyncOperation' utility was returning the 'originalError' object to the caller, which could contain stack traces, internal paths, and detailed error messages from Firebase or other services. If this object reached the frontend, it could be exposed to users or logged to the browser console.

**Learning:** Centralized error handlers are high-leverage points for security. Even if they provide 'user-friendly' messages, they must not accidentally pass through the raw error objects.

**Prevention:** Always sanitize error objects in centralized handlers. Log the full error to the console (or a secure logging service) but return only the necessary fields (code, user-friendly message) to the application logic.
