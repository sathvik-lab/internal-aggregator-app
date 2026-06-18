## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-09 - Information Leakage via Error Objects and Account Enumeration

**Vulnerability:** The `handleAsyncOperation` utility was returning the `originalError` object to callers, which could include stack traces and internal metadata. Additionally, `getErrorMessage` provided specific messages for non-existent users, enabling account enumeration.

**Learning:** Centralized error handlers can inadvertently become a source of information leakage if they don't explicitly sanitize the error objects they pass back to UI components. Developers might rely on these raw objects for debugging, but they pose a risk in production.

**Prevention:** Always sanitize error objects in centralized utilities before returning them to the UI. Ensure that authentication-related errors use generic messages ("Invalid email or password") to prevent leaking user existence.
