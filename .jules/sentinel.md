# Sentinel Security Journal

## 2025-05-14 - Genericizing Authentication Errors and Removing PII Logging

**Vulnerability:** The application was exposing whether an email address was registered or not through specific error messages ("No account found with this email" vs "Incorrect password"). Additionally, full user objects were being logged to the console upon successful login and signup, which could contain sensitive PII.

**Learning:** Firebase Auth error codes like `auth/user-not-found` and `auth/wrong-password` should be mapped to a single generic message (e.g., "Invalid email or password") to prevent account enumeration attacks. Password reset flows should indicate success even if the email is not in the system.

**Prevention:**
1. Always use generic error messages for authentication failures.
2. In password reset flows, always show a success message regardless of user existence.
3. Avoid logging full objects that may contain PII; log only non-sensitive identifiers if necessary.
4. Centralize error mapping in services or utility functions to ensure consistency across the UI.
