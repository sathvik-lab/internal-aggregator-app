## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Mutable Role Field

**Vulnerability:** Firestore security rules allowed users to write to their own user document without restricting which fields could be modified. This allowed a user to escalate their privileges by changing their `role` from `staff` to `owner` via a client-side update.

**Learning:** Overly permissive write rules on user documents can lead to privilege escalation if security-critical fields like `role` are stored in the same document as user-editable profile data. Separating "security role" from "display title" is a good practice, but it must be enforced at the database level.

**Prevention:** Use Firestore's `affectedKeys()` check to prevent client-side modification of sensitive fields: `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`. Additionally, ensure that new user creation is restricted to a default, low-privilege role.
