## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Mutable Security Roles

**Vulnerability:** The application allowed users to modify their own `role` field through the profile editing UI, and Firestore security rules did not prevent this. This created a significant privilege escalation risk where any user could grant themselves administrative privileges.

**Learning:** Security roles should always be separated from display-only fields (like job titles). Relying on client-side constraints for security is insufficient; the backend (Firestore rules) must explicitly enforce immutability for sensitive fields using patterns like `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`.

**Prevention:** Use a separate `jobTitle` field for user-editable display names. In Firestore rules, restrict the `role` field so it can only be set to a safe default on creation and never modified by the user.
