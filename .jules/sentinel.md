## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-27 - User Privilege Escalation via Firestore Rules

**Vulnerability:** The `users` collection had a broad `allow write: if isOwner(userId)` rule. This allowed any authenticated user to modify any field in their own document, including the `role` field. An attacker could elevate their own privileges by changing their role to `owner` via a client-side update.

**Learning:** Relying solely on `isOwner` helper functions for write permissions is insufficient when the document contains security-sensitive fields like roles or permissions. Broad write permissions grant full control over the document structure.

**Prevention:** Use granular Firestore rules (`create`, `update`). For `create`, strictly enforce default roles. For `update`, use `request.resource.data.diff(resource.data).affectedKeys()` to explicitly block modifications to sensitive fields.
