## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Firestore Privilege Escalation via Role Modification

**Vulnerability:** Users were able to modify their own 'role' field in the 'users' collection, allowing them to escalate their privileges to 'owner' via client-side Firestore updates.

**Learning:** Relying solely on 'isOwner(userId)' for write permissions is insufficient when a document contains security-critical fields like 'role'. Firestore rules must explicitly restrict which fields are allowed to be updated by the client.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore security rules to prevent clients from modifying security roles. Separate security-sensitive roles from display-only fields like 'jobTitle' to maintain functionality while enforcing strict access control.
