## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via Profile Update

**Vulnerability:** Users were able to escalate their own privileges (e.g., from 'staff' to 'owner') by modifying the 'role' field in their profile document. This was possible because Firestore security rules allowed unrestricted 'write' access to the user's own document, and the UI exposed the 'role' field as an editable text input.

**Learning:** Trusting client-side input for sensitive fields like user roles is a critical security risk. Even if the UI is intended for display only, unless the backend (Firestore rules) explicitly prevents modification, any authenticated user can bypass the UI and update the data directly via the API or modified client code.

**Prevention:** Use field-level validation in Firestore security rules to prevent modification of sensitive fields by users. Specifically, use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` to block updates to the role field. Separate security-critical roles from display-only job titles in the data model and UI.
