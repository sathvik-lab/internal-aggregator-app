## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Client-Side Privilege Escalation via User Profile Updates

**Vulnerability:** Firestore security rules allowed users to update their own document in the 'users' collection without field-level restrictions, enabling them to modify their 'role' field (e.g., from 'staff' to 'owner'). Additionally, 'handleAsyncOperation' was returning the full error object, potentially leaking stack traces and internal data structures.

**Learning:** Granting 'write' access to a user's own document is a common pattern but must be hardened with field-level checks if sensitive fields like 'role' are stored in that same document. Separating system-level security fields (immutable by users) from display-level fields (editable) is a key defense-in-depth practice.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys()` in Firestore rules to prevent modification of sensitive fields. Always sanitize error objects before returning them to the client to avoid information leakage.
