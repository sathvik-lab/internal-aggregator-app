## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via User Role Modification

**Vulnerability:** The Firestore security rules for the 'users' collection were too permissive, allowing users to write to their own document without field-level restrictions. This allowed any authenticated user to change their 'role' field (e.g., from 'staff' to 'owner'), potentially granting themselves administrative privileges.

**Learning:** Relying on 'isOwner' checks for entire documents is insufficient when certain fields (like roles or permissions) should be immutable for the user. Separation of security roles from user-defined display titles (like job titles) is crucial for both security and UX.

**Prevention:** Use Firestore `diff().affectedKeys()` to block client-side updates to sensitive fields. Implement field-level validation in security rules to ensure default roles are enforced during document creation. Rename user-facing 'role' fields to 'jobTitle' or similar to avoid confusion with security roles.
