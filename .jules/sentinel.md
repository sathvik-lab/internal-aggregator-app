# Sentinel's Journal - Critical Security Learnings

## 2025-05-14 - [Prevention of Account Enumeration]
**Vulnerability:** The application used specific error messages like "No account found with this email" during login and password reset flows, which allowed attackers to enumerate registered users.
**Learning:** UX convenience (telling a user why their login failed) can leak sensitive information about the user base.
**Prevention:** Use generic error messages (e.g., "Invalid email or password") and non-committal success messages for password resets (e.g., "If an account exists, a reset link has been sent").
