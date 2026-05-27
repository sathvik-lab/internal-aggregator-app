## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via User Profile Update

**Vulnerability:** Users were able to update their own `role` field in Firestore because the security rules allowed unrestricted `write` access to their own document. This enabled a 'staff' user to escalate their privileges to 'owner' by simply modifying the `role` field in their profile.

**Learning:** When allowing users to manage their own profile data, it's critical to implement field-level security checks to prevent them from modifying sensitive authorization-related fields. Using `request.resource.data.diff(resource.data).affectedKeys()` in Firestore rules is an effective way to enforce these restrictions.

**Prevention:** Use granular Firestore security rules to explicitly deny updates to sensitive fields like `role`. Separate display-only titles (e.g., `jobTitle`) from security-critical roles. Ensure new profiles are created with a default low-privilege role.
