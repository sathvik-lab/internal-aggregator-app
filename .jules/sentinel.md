## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - User Privilege Escalation via Profile Update

**Vulnerability:** Users were able to modify their own `role` field in Firestore because the security rules allowed full write access to their own document. This allowed any user to escalate their privileges to 'owner'.

**Learning:** Identity and Access Management (IAM) should not be solely reliant on client-side logic. Even if the UI doesn't provide a way to change a field, an attacker can use the SDK or API directly if the server-side rules (like Firestore Rules) allow it.

**Prevention:** Use granular Firestore rules to restrict which fields a user can update. Specifically, use `request.resource.data.diff(resource.data).affectedKeys()` to block updates to security-sensitive fields like `role`. Additionally, separate user-editable metadata (e.g., `jobTitle`) from system-controlled security attributes (e.g., `role`).
