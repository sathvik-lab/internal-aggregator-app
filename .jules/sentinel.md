## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation via Firestore Rules

**Vulnerability:** Firestore security rules allowed users to write to their own user document without field-level restrictions, enabling them to change their own 'role' (e.g., from 'staff' to 'owner'). Additionally, the client-side profile editor allowed users to modify this field directly.

**Learning:** Trusting client-side input for security-sensitive fields like 'role' is a common vulnerability. Security rules must explicitly prevent modification of authorization-related fields by the resource owner.

**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore rules to prevent modification of sensitive fields. Separate security roles from displayable titles (like 'jobTitle') to allow user customization without compromising security.
