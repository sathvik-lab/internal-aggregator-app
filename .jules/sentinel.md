## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-02 - Unauthorized Role Escalation via Client-side Update

**Vulnerability:** Users were able to modify their own 'role' field in Firestore through client-side updates in the profile editing flow. This allowed any authenticated user to escalate their privileges to 'owner' by simply including the field in their update request.

**Learning:** Relying on client-side logic or UI restrictions to protect sensitive fields is insufficient. Backend security rules (Firestore Rules) must explicitly prevent modification of authorization-related fields, even for the resource owner.

**Prevention:** Use Firestore security rules with `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to block updates to sensitive fields. Separate display titles (like 'jobTitle') from security roles to allow users to customize their profile without risking privilege escalation.
