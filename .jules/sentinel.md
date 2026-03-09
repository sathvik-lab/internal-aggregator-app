## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Firestore Privilege Escalation and Information Leakage via Errors

**Vulnerability:** Firestore security rules allowed users to modify their own `role` field, enabling privilege escalation to 'owner'. Additionally, the application's error handler was returning the `originalError` object to the frontend, which could leak sensitive internal details and stack traces.

**Learning:** Client-side updates to user profiles often include sensitive fields if not explicitly filtered. Firestore rules must use `affectedKeys()` to protect these fields. Generic error handling should strip internal error objects before they reach the client to adhere to the principle of fail securely.

**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore rules to protect security-sensitive fields. Always sanitize error objects in central error handlers to remove stack traces and internal details. Separate security roles from display-only fields like `jobTitle`.
