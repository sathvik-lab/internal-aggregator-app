## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Unauthorized Role Modification

**Vulnerability:** The application allowed users to modify their own `role` field in Firestore, potentially enabling privilege escalation from `staff` to `owner`. Additionally, the UI coupled the security role with the display job title, leading to a confusion of concerns and an insecure update pattern.

**Learning:** Combining security-critical fields (like `role`) with user-editable profile fields (like job title) in a single update payload without server-side validation or strict database rules is a common source of privilege escalation. Clients should never be trusted to manage their own security roles.

**Prevention:** Enforce immutability of security roles using Firestore rules (`diff().affectedKeys().hasAny(['role'])`). Separate security roles from display titles in the database schema. Ensure that new user accounts are initialized with the lowest possible privilege level via mandatory field checks in the `create` rule.
