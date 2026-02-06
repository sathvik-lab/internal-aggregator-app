## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-06 - Privilege Escalation in Firestore Rules

**Vulnerability:** The Firestore security rules for the `users` collection were too permissive, allowing any authenticated user to write to their own user document without field-level restrictions. This allowed a user to escalate their own privileges by modifying the `role` field from `staff` to `owner`.

**Learning:** Enforcing document ownership (e.g., `request.auth.uid == userId`) is a good baseline but insufficient when documents contain security-critical fields. Field-level immutability is required for roles and permissions.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to prevent updates to sensitive fields and strictly validate the `role` field during document creation to ensure only a default, non-privileged role can be set by the client.
