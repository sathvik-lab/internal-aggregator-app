## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-06 - Firestore Privilege Escalation via User-Controlled Role Field

**Vulnerability:** Users were able to set and update their own 'role' field in Firestore documents, allowing any user to escalate their privileges to 'owner' or 'admin' by simply modifying the client-side request.

**Learning:** Firestore security rules that allow generic 'write' access to user documents without field-level restrictions are a common source of privilege escalation. Clients should never be trusted to manage their own security-critical metadata.

**Prevention:** Use 'request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' to block updates to security fields. Enforce specific values for security fields during 'create' operations (e.g., 'request.resource.data.role == "staff"'). Always separate user-editable display fields (like 'jobTitle') from system-controlled security fields (like 'role').
