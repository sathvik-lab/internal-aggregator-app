## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Client-Side Role Modification

**Vulnerability:** The application allowed users to modify their own `role` field in the `users` Firestore collection. The profile editing UI incorrectly exposed this field, and Firestore security rules lacked the necessary checks to prevent its modification by the owner of the document.

**Learning:** Relying solely on UI-level restrictions for security roles is insufficient. Security roles must be protected at the database level using rules that prevent users from modifying sensitive fields, even if they own the document. Furthermore, separating security roles (e.g., `role`) from display titles (e.g., `jobTitle`) provides a clearer security model.

**Prevention:** Use Firestore security rules to explicitly block modification of sensitive fields like `role` using `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`. In the UI, ensure that only non-sensitive fields are editable by the user.
