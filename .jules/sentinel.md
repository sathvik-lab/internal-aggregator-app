## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-07 - User Role Privilege Escalation in Firestore

**Vulnerability:** The Firestore security rules for the 'users' collection were overly permissive, allowing any authenticated user to update their own document without field-level restrictions. This enabled users to self-assign privileged roles (e.g., changing 'role' from 'staff' to 'owner') by bypassing the UI and interacting directly with the Firebase SDK.

**Learning:** Relying solely on UI-level restrictions for sensitive fields is insufficient in client-side applications using direct database access (like Firebase). Security rules must explicitly protect sensitive fields from client-side modification.

**Prevention:** Use the `diff()` and `affectedKeys()` functions in Firestore rules to prevent modification of sensitive security fields like 'role'. Additionally, enforce a default, low-privilege role during document creation to prevent users from self-assigning high-level roles upon signup.
