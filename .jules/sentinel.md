## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Firestore Privilege Escalation and Information Leakage

**Vulnerability:** Firestore rules allowed users full 'write' access to their own document, including the 'role' field, enabling privilege escalation. Additionally, the 'handleAsyncOperation' utility was returning the 'originalError' object to the client, potentially exposing stack traces and internal database metadata.

**Learning:** Granular control is essential in security rules; 'write' is often too permissive as it includes 'update' and 'create' without field-level restrictions. Error wrappers should explicitly pick safe fields rather than passing the entire error object.

**Prevention:** Use granular Firestore rules ('allow create', 'allow update') and enforce field immutability using 'request.resource.data.diff(resource.data).affectedKeys().hasAny([...])'. Sanitize error responses by omitting internal error objects and genericizing auth-related messages.
