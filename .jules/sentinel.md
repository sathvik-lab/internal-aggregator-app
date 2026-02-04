## 2026-02-03 - Authentication Account Enumeration and PII Leakage

**Vulnerability:** The application was leaking whether an email address was registered through specific error messages in the login and password reset flows ("No account found with this email"). Additionally, full user objects (containing PII) were being logged to the console upon successful authentication.

**Learning:** Error handling often prioritizes user experience (telling them exactly what's wrong) over security. Similarly, verbose logging is often left in from development to verify data structures but can lead to data leakage in production.

**Prevention:** Always genericize authentication errors (e.g., "Invalid email or password"). For password resets, always indicate success regardless of whether the account exists. Sanitize logs to ensure no sensitive user data or full objects are printed to the console.

## 2026-02-04 - Privilege Escalation via User Role Modification

**Vulnerability:** Users were able to promote themselves to the 'owner' role because Firestore security rules allowed unrestricted 'write' access to their own user documents. Additionally, the profile editing UI overloaded the 'role' field for both security roles and professional job titles, allowing users to inadvertently or maliciously change their authorization level.

**Learning:** Combining security-critical authorization fields with user-editable profile data in a single document is dangerous unless fine-grained field-level security rules are applied. Broad ownership rules (e.g., `allow write: if request.auth.uid == userId`) are insufficient for documents containing authorization metadata.

**Prevention:** Separate security roles from user-editable profile data (e.g., use 'jobTitle' for display and 'role' for authorization). Apply field-level validation in Firestore rules to prevent users from modifying sensitive fields like 'role', 'permissions', or 'plan_level'.
