## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Firestore Privilege Escalation and Generic Error Hardening

**Vulnerability:** The `firestore.rules` allowed users to modify their own `role` field, enabling privilege escalation to `owner`. Additionally, `src/utils/errorHandler.js` was leaking internal technical details via the `originalError` property and used specific messages that allowed for account enumeration.

**Learning:** Database security rules must explicitly protect sensitive fields (like roles) using `diff().affectedKeys()` to ensure they remain immutable from the client. Global error handlers must be carefully audited to ensure they don't inadvertently re-introduce vulnerabilities (like info leakage) that were fixed in other parts of the system.

**Prevention:** Use standard Firebase patterns for field-level immutability. Sanitize all error objects returned to the UI by explicitly selecting only the fields that are safe to expose (code and user-friendly message), and never return the raw error object.
