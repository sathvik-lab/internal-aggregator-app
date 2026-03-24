## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation via Role Modification

**Vulnerability:** Users were able to modify their own 'role' field in Firestore through the client-side profile editing interface and broad 'write' security rules. This allowed a 'staff' user to elevate themselves to an 'owner' role.

**Learning:** Trusting client-side input for sensitive fields like 'role' is a critical security flaw. Even if the UI is restricted, broad database security rules (like `allow write: if isOwner(userId)`) allow users to send arbitrary updates via the SDK.

**Prevention:** Use granular Firestore security rules to explicitly prevent updates to sensitive keys using `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`. Decouple system roles from user-editable fields (like 'jobTitle') in both the UI and the database schema.
