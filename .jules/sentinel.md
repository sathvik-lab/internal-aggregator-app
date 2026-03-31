## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-31 - Privilege Escalation via Unauthorized User Role Modification

**Vulnerability:** Firestore security rules allowed users to perform arbitrary updates on their own document in the 'users' collection. This included the 'role' field, which could be exploited by a malicious user to escalate their privileges (e.g., from 'staff' to 'owner') by sending a modified update request from the client.

**Learning:** When using client-side SDKs with Firestore, 'owner-only' write access is often too permissive for the 'users' collection. Sensitive system fields like roles must be protected using field-level validation in security rules.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore security rules to explicitly prevent client-side modification of security-sensitive fields. Separate system roles from user-defined metadata like job titles to avoid accidental permission grants.
