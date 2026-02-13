## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-13 - Privilege Escalation via Client-Side Role Modification

**Vulnerability:** The application allowed users to modify their own `role` field in the `users` Firestore collection due to overly permissive security rules (`allow write: if isOwner(userId)`). Additionally, the UI incorrectly exposed the `role` field as editable, potentially allowing a 'staff' user to elevate their privileges to 'owner'.

**Learning:** Firestore `write` rules are often too broad. Security-critical fields should be protected using `affectedKeys()` to prevent client-side modification. The UI should also separate security roles from display titles.

**Prevention:** Use granular Firestore rules (`create`, `update`, `delete` instead of `write`). Enforce immutability for sensitive fields like `role` by checking `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`. Use a separate field like `jobTitle` for user-editable display titles.
