## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Client-Side Privilege Escalation and Information Leakage

**Vulnerability:** Firestore security rules allowed users to modify their own 'role' field, enabling potential privilege escalation from 'staff' to 'owner'. Additionally, the 'errorHandler.js' utility was returning 'originalError' in API responses, which could leak internal system details and stack traces to the frontend.

**Learning:** Relying solely on client-side UI restrictions for security fields is insufficient; Firestore rules must explicitly protect sensitive fields using 'request.resource.data.diff(resource.data).affectedKeys()'. Error handlers should never pass through raw error objects to the client.

**Prevention:** Enforce immutable or restricted fields in Firestore rules. Implement a separate 'jobTitle' field for display purposes while keeping 'role' for security. Sanitize all error responses by removing raw error objects or stack traces before sending them to the client.
