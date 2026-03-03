## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Unauthorized Privilege Escalation via Mass Assignment

**Vulnerability:** The application allowed users to modify their own 'role' field in Firestore through the profile editing UI. Firestore security rules did not restrict which fields could be updated by the document owner, enabling any user to escalate their privileges to 'owner'.

**Learning:** Trusting client-side input for sensitive fields like 'role' is a classic security flaw. Document ownership in Firestore (`request.auth.uid == userId`) does not implicitly mean the user should have permission to modify all fields within that document.

**Prevention:** Use field-level security in Firestore rules using `request.resource.data.diff(resource.data).affectedKeys()` to explicitly block modifications to sensitive fields. Separate security roles from user-editable display fields (e.g., use 'jobTitle' for display and keep 'role' immutable for users).
