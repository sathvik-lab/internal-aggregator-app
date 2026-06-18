## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-05 - User Role Privilege Escalation via Firestore Rules

**Vulnerability:** Firestore security rules allowed users to update their own `role` field in the `users` collection. Additionally, the profile editing UI mixed the security `role` with a display `jobTitle`, allowing users to overwrite their security role with arbitrary text.

**Learning:** Over-permissive `write` rules can lead to privilege escalation if security-sensitive fields (like roles or permissions) are stored in the same document that the user is allowed to edit. Separation of concerns between security metadata and user-editable display data is crucial.

**Prevention:** Always use specific `create` and `update` rules instead of a generic `write` rule for documents containing sensitive fields. Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['sensitive_field'])` to prevent users from modifying restricted fields. Separate security roles from user-editable display titles in the data schema.
