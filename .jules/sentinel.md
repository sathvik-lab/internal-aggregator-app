## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-05 - Privilege Escalation via Client-Side Role Modification

**Vulnerability:** Firestore security rules for the 'users' collection were overly permissive (`allow write: if isOwner(userId)`), allowing users to modify any field in their document, including their security `role`. The 'EditProfileModal' component also incorrectly mapped a user-editable "Role/Title" field to this critical `role` field in Firestore.

**Learning:** Combining permissive backend rules with UI-level field misuse creates a direct path for privilege escalation. Security roles must be treated as immutable by the client and separated from display-only fields like job titles.

**Prevention:** Use Firestore rules with `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to block client-side modification of security fields. Separate security roles from display titles ('jobTitle') in the data model and ensure the UI only interacts with the latter.
