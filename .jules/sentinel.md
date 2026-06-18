## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-27 - Information Disclosure and Account Enumeration Hardening

**Vulnerability:** Core async handling utility was returning raw error objects (`originalError`), potentially exposing internal stack traces. Additionally, authentication error messages were still specific enough to allow account enumeration, and Firebase initialization logged project metadata in production.

**Learning:** Centralized error handlers and initialization scripts often carry over "helpful" debugging information from development into production, creating accidental information disclosure vectors.

**Prevention:** Explicitly strip raw error objects in centralized handlers. Wrap all project-specific metadata logging in environment checks (e.g., `__DEV__`). Audit error mapping tables regularly to ensure generic messages are used for all authentication flows.
