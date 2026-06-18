## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-19 - Privilege Escalation and Information Leakage Hardening

**Vulnerability:** Users could escalate their privileges by modifying the 'role' field in their Firestore user document. Additionally, the application leaked whether an account existed via specific auth error messages and exposed internal error details (stack traces) through the 'originalError' property in async operations.

**Learning:** Database security rules must explicitly restrict modification of sensitive fields, and error handling utilities must act as a security boundary by sanitizing and genericizing errors before they reach the UI layer.

**Prevention:** Implement field-level validation in Firestore rules using 'request.resource.data.diff(resource.data).affectedKeys()'. Centralize error mapping to genericize sensitive authentication codes and explicitly remove raw error objects from public-facing data structures.
