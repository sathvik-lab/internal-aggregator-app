## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Firestore Privilege Escalation and Information Leakage

**Vulnerability:** Users could escalate their privileges by modifying their own `role` field in the `users` collection via client-side updates. Additionally, the application leaked internal error details and stack traces through the `originalError` property in the `handleAsyncOperation` utility.

**Learning:** Relying solely on client-side logic to protect sensitive fields is insufficient when the database allows direct client writes. Furthermore, returning raw error objects to the frontend can expose sensitive infrastructure details or codebase structure.

**Prevention:** Use Firestore security rules with `affectedKeys().hasAny(['role'])` to block client-side modification of security-critical fields. Always strip internal technical details from error objects before returning them to the UI, providing only user-friendly messages.
