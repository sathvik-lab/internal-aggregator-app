## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-12 - Privilege Escalation via Role Modification

**Vulnerability:** The application allowed users to modify their own `role` field in the Firestore `users` collection through the client SDK. This could lead to privilege escalation if the `role` field is used for authorization. Additionally, user documents could be deleted by the owners, leading to loss of audit trails.

**Learning:** Combining security roles and display titles into a single mutable field exposes the system to privilege escalation. Firestore security rules must explicitly restrict which fields can be updated by the client and prohibit deletions of critical data like user profiles.

**Prevention:** Separate security-critical fields (like `role`) from user-editable fields (like `jobTitle`). Use Firestore security rules with `request.resource.data.diff(resource.data).affectedKeys()` to prevent client-side modification of sensitive fields and explicitly deny `delete` operations on audit-critical collections.
