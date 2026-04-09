## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-14 - Privilege Escalation via Client-Side Role Modification

**Vulnerability:** Firestore security rules allowed users to modify their own document entirely, including the `role` field. This permitted users to escalate their own privileges (e.g., from 'staff' to 'owner') via the client SDK.

**Learning:** Granting `write` access to a user's own document is a common but dangerous pattern if the document contains security-critical fields. Client-side code should never be trusted to manage authorization-related data.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore rules to prevent modification of sensitive fields. Separate security roles from user-editable display titles (like `jobTitle`).
