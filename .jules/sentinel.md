## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Privilege Escalation via Client-Side Role Modification

**Vulnerability:** Firestore security rules for the 'users' collection allowed users to modify any field in their own document, including the 'role' field. This enabled users to escalate their own privileges (e.g., from 'staff' to 'owner') via client-side SDK calls.

**Learning:** Relying on UI-level restrictions for security is insufficient. Security rules must explicitly protect sensitive fields like 'role' from client-side updates using 'affectedKeys().hasAny()'.

**Prevention:** Use 'request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' in Firestore rules to prevent modification of sensitive fields. Enforce default roles (e.g., 'staff') on document creation.
