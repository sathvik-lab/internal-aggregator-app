## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation via Profile Update

**Vulnerability:** Users could change their own security `role` (e.g., from 'staff' to 'admin') by modifying the 'Role' field in the profile edit form, which sent the updated role directly to Firestore without server-side validation.

**Learning:** Client-side inputs should never be trusted for security-sensitive fields. Even if a field is intended for display purposes, it should be clearly distinguished from internal security attributes in the data model and protected at the database level.

**Prevention:** Use Firestore security rules to prevent modification of security-sensitive fields (`request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`). Separate display titles (e.g., `jobTitle`) from security roles (`role`) in the database schema.
