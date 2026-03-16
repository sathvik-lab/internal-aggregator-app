## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Privilege Escalation via Role Modification

**Vulnerability:** Users were able to modify their own 'role' field in Firestore through client-side updates. Additionally, new users could specify any role (e.g., 'owner') during registration, leading to unauthorized privilege escalation.

**Learning:** Relying on client-side logic to protect security-sensitive fields is insufficient. Firestore security rules must explicitly block modification of fields that define access control.

**Prevention:** Use 'request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' in Firestore rules to prevent modification of sensitive fields. Enforce specific values for security fields during resource creation (e.g., 'request.resource.data.role == 'staff''). Separate display-only titles (like 'jobTitle') from security roles to allow users to update their profile without compromising security.
