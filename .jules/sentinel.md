## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Firestore Rules

**Vulnerability:** Firestore security rules for the `users` collection were overly permissive (`allow write: if isOwner(userId)`), allowing authenticated users to modify any field in their own profile document, including the `role` field. This allowed a user to escalate their own privileges (e.g., from 'staff' to 'owner') by simply sending an update request via the client-side SDK.

**Learning:** Trusting the client to define its own permissions is a common architectural flaw. Even if the UI doesn't provide a way to change a field, the underlying SDK/API might allow it if not restricted on the server/database level.

**Prevention:** Use field-level validation in Firestore rules to prevent modification of sensitive fields. Specifically, use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to block updates to the `role` field. Additionally, ensure that document creation rules strictly enforce default roles.
