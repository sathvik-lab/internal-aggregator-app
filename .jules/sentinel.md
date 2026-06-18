## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-05-22 - User Privilege Escalation via Role Modification

**Vulnerability:** The application allowed users to edit their own `role` field in Firestore through the profile editing UI, which mapped a "Role/Title" input directly to the security `role` field. Firestore rules also lacked restrictions on modifying the `role` field for the user's own document.

**Learning:** It is crucial to decouple display-only information (like a job title) from security-critical metadata (like an authorization role). Relying on client-side logic to protect sensitive fields is insufficient; Firestore rules must explicitly prevent modification of sensitive fields using `diff().affectedKeys()`.

**Prevention:** Use a separate field (e.g., `jobTitle`) for user-editable display titles. Enforce immutability of security roles (e.g., `role`) in Firestore rules for client-side updates, and validate the initial role during document creation.
