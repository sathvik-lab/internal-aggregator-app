## 2025-05-21 - Account Enumeration in Auth Flows

**Vulnerability:** The application was providing specific error messages for 'auth/user-not-found' and 'auth/wrong-password' during login and password reset. This allowed an attacker to determine if a specific email address was registered in the system.

**Learning:** Authentication error messages must be generic (e.g., "Invalid email or password") across all layers of the application (services, error handlers, and UI components) to prevent information leakage. In password reset flows, the success message should be shown even if the user is not found.

**Prevention:** Use a unified error message for all credential-related failures. Ensure service-level error handlers return success or generic errors for user-existence checks in public forms. Regularly scan authentication screens for specific error mappings.

## 2025-05-21 - Sensitive Data Leakage in Logs

**Vulnerability:** Full Firebase user objects were being logged to the console upon successful login and signup. These objects can contain sensitive information like UIDs, provider data, and metadata.

**Learning:** Logging full user or data objects in production-ready code can lead to PII (Personally Identifiable Information) leakage.

**Prevention:** Remove debug logs before merging. If logging is necessary, only log non-sensitive, specific fields.
