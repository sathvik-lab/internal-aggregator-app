## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-03 - Privilege Escalation via Mass Assignment

**Vulnerability:** The application was allowing users to modify their own `role` field in Firestore via the client-side SDK. This field was intended for security permissions but was also used in the UI for a user's professional title, creating a privilege escalation risk where a user could grant themselves `owner` permissions.

**Learning:** Overloading a security-sensitive field (like `role`) with display-only information (like a job title) encourages making that field editable by the user, which can bypass security controls if not properly restricted in backend rules.

**Prevention:** Separate security-sensitive metadata from user-editable profile data. Implement Firestore security rules that explicitly block updates to sensitive fields using `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`.
