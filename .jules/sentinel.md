## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Generic Error Handling Vulnerabilities

**Vulnerability:** The central error handling utility (`errorHandler.js`) was providing specific messages for `auth/user-not-found` and `auth/wrong-password`, allowing for account enumeration despite generic messages being implemented in the primary login screen. Furthermore, it was returning the full `originalError` object, which could leak internal stack traces or library-specific details.

**Learning:** Security fixes must be applied at the lowest possible layer (the utility layer) to ensure all parts of the application benefit from the protection. Relying on individual screens to genericize errors is prone to omission.

**Prevention:** Centralize error mapping for sensitive operations (like Auth) and ensure that returned error objects only contain necessary, user-safe information. Avoid passing raw error objects to higher layers.
