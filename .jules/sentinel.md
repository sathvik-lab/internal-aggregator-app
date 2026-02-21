## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Internal Error and Information Leakage via Error Handling

**Vulnerability:** The application's core async error handler (`handleAsyncOperation`) was returning the original error object to the caller, which included internal details like stack traces. Additionally, some Firebase error codes were still being mapped to specific, non-generic messages in the utility layer.

**Learning:** General-purpose error handling utilities often unintentionally pass through raw error objects for "convenience," but this exposes sensitive internal information (Information Leakage) if that object is eventually used in the UI or sent to the client.

**Prevention:** Always sanitize error objects before returning them from utility functions. Remove raw `Error` objects and only return a safe code and a genericized message. Log the technical details only to the server-side console or a secure logging service, never expose them to the client.
