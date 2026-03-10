## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Privilege Escalation and Information Leakage

**Vulnerability:** Users could escalate their privileges by modifying the 'role' field in their Firestore document. Additionally, internal stack traces were exposed to the client via the 'originalError' property in async operations.

**Learning:** Field-level security is critical when users have write access to their own documents. Trusting client-side logic to omit sensitive fields is insufficient; Firestore rules must enforce immutability of security-sensitive fields. Verbose error handling, while useful for debugging, creates a reconnaissance vector for attackers.

**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` in Firestore rules to prevent unauthorized field modifications. Separate security roles (e.g., 'role') from display titles (e.g., 'jobTitle'). Sanitize error responses by removing internal error objects and stack traces before they reach the client.
