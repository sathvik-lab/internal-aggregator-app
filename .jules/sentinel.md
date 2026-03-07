## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-03 - Privilege Escalation via Firestore Rules

**Vulnerability:** The 'users' collection rules allowed any authenticated user to 'write' to their own document without field-level restrictions. This enabled users to modify their 'role' field (e.g., from 'staff' to 'owner') via the client SDK.

**Learning:** Firestore 'write' rules are broad. Without using 'request.resource.data.diff(resource.data).affectedKeys()', any field in a document is mutable by the user who has write access.

**Prevention:** Always use fine-grained rules to protect sensitive fields like 'role', 'permissions', or 'subscriptionStatus'. Use 'hasAny()' or 'hasOnly()' on the diff of affected keys to white-list or black-list specific fields from client-side updates.

## 2026-02-03 - Internal Error Leakage in Async Handlers

**Vulnerability:** The global 'handleAsyncOperation' utility was returning the 'originalError' object to the caller. When caught by the frontend, this could expose stack traces, database schema details, or internal API structures to the end user.

**Learning:** Passing raw error objects through abstraction layers often leads to unintended data exposure in the UI or console logs.

**Prevention:** Sanitize error objects before returning them to the UI layer. Only expose a sanitized 'code' and a user-friendly 'message'. Never include the original error object or stack trace in production responses.
