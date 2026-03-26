## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation via Firestore Role Modification

**Vulnerability:** Any authenticated user could modify their own `role` field in the `users` collection through the client-side profile update flow, allowing them to escalate their privileges to `owner`.

**Learning:** Allowing blanket `write` or `update` access to a user's own document is dangerous if that document contains security-sensitive fields like `role`. Trusting the client to exclude these fields from update payloads is insufficient.

**Prevention:** Use granular Firestore rules to prevent modification of specific fields. Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to block unauthorized role changes. Ensure the frontend uses a separate field (e.g., `jobTitle`) for user-facing descriptions to distinguish from internal authorization roles.
