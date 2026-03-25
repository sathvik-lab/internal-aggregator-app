## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Client-Side Privilege Escalation and Information Leakage

**Vulnerability:** The application allowed users to modify their own `role` field via Firestore rules, and the `EditProfileModal` UI exposed this field for editing. Additionally, `handleAsyncOperation` leaked internal error details through an `originalError` property.

**Learning:** Firestore rules must explicitly protect sensitive fields like `role` using `affectedKeys()`. UI components should use separate fields for display data (e.g., `jobTitle`) and authorization data (e.g., `role`). Error handlers must sanitize outputs to avoid leaking stack traces or implementation details.

**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore rules. Decouple security roles from user-editable profile fields. Ensure error objects returned to the frontend contain only user-friendly messages and generic error codes.
