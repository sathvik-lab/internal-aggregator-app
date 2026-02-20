## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2025-05-23 - Privilege Escalation via Role Modification **Vulnerability:** Users could modify their own 'role' field in Firestore through the profile editing UI or direct API calls, potentially granting themselves administrative privileges. **Learning:** The application confounded a display 'job title' with a security 'role', and Firestore rules were too permissive (allowing full 'write' access to the owner). **Prevention:** Separate security roles from user-editable display fields. Use Firestore 'affectedKeys().hasAny()' checks to prevent modification of sensitive fields by client SDKs.
