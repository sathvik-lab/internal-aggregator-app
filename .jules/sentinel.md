## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-03-27 - Residual Information Leakage in Services and Error Handlers

**Vulnerability:** Technical details were still being leaked through `originalError` in the centralized error handler. Additionally, initialization logs in the Firebase service disclosed the presence/absence of specific configuration keys, which could aid an attacker in mapping the infrastructure.

**Learning:** Hardening auth flows is only part of the battle; centralized utilities (like error handlers) and initialization logic often contain "convenience" logs or data fields that inadvertently leak internal state or technical stack details.

**Prevention:** Ensure that error handling wrappers explicitly whitelist fields for the client and omit raw error objects. Initialization logic should fail silently or with generic warnings in production, avoiding detailed configuration status logs.
