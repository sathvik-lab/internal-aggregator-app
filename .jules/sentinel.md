## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-08 - Privilege Escalation via User Role Modification

**Vulnerability:** Users were able to modify their own `role` field in the `users` Firestore collection through client-side updates. This allowed any authenticated user to elevate their privileges to `owner` by sending a malicious update request. Additionally, the global error handler was leaking internal error details and stack traces via the `originalError` property.

**Learning:** Relying solely on client-side logic or Auth context for security is insufficient. Security roles must be protected by server-side rules (Firestore Security Rules) and separated from editable display fields (like `jobTitle`).

**Prevention:** Use Firestore Security Rules to prevent modification of sensitive fields: `allow update: if !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`. Separate security roles from user-editable titles. Harden error handlers by omitting internal error objects and stack traces.
