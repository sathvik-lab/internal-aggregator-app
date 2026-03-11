## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation and Information Leakage

**Vulnerability:** Firestore security rules for the `users` collection were overly permissive, allowing authenticated users to update any field in their document, including their `role`. This could lead to privilege escalation (e.g., a user making themselves an `owner`). Additionally, `handleAsyncOperation` in `errorHandler.js` was leaking the `originalError` object to the client, which could contain sensitive stack traces or internal implementation details.

**Learning:** "Allow write: if isOwner(userId)" is often insufficient for user profiles as it doesn't protect sensitive fields like roles. Security rules must use `request.resource.data.diff(resource.data)` to restrict modification of security-critical fields. Furthermore, error handlers must explicitly whitelist or sanitize what is returned to the client to avoid information leakage.

**Prevention:** Use `affectedKeys().hasAny(['role'])` in Firestore rules to prevent client-side role modification. Enforce a default role (e.g., 'staff') during document creation in security rules. Ensure error handling utilities omit raw error objects when returning to the UI.
