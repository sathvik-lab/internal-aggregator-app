## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Unauthorized Role Modification via Firestore

**Vulnerability:** Users were able to modify their own `role` field in the `users` collection because Firestore rules lacked field-level protection. The UI also incorrectly exposed the `role` field for editing, creating a privilege escalation risk.

**Learning:** Relying solely on ownership checks in Firestore rules (`isOwner(userId)`) is insufficient if the document contains sensitive fields like roles or permissions. UI/UX should also separate security-critical fields from user-editable profile data.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys()` in Firestore rules to prevent client-side modification of sensitive fields. Separate security roles from display titles (e.g., use `jobTitle` for user-editable display and `role` for internal authorization).
