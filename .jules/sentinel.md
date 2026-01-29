## 2026-01-29 - Path Traversal Vulnerability in Document Uploads

**Vulnerability:** A path traversal vulnerability was identified in the `UploadDocumentModal` component. User-provided file names were used directly to construct storage paths in Firebase Storage (e.g., `user_documents/USER_ID/UNIQUE_ID_FILENAME.EXT`). A malicious user could provide a filename like `../../OTHER_USER_ID/FILE` to attempt to write files into other users' directories.

**Learning:** Even when cloud storage rules (like Firebase Storage rules) are in place to restrict access by `userId`, it is critical to sanitize any user-controlled input that contributes to file paths. This defense-in-depth approach prevents unexpected behavior and potential rule bypasses if the security rules are ever misconfigured or become overly complex.

**Prevention:** All user-provided strings used in file paths or resource identifiers must be sanitized. I implemented a `sanitizeFileName` utility that restricts filenames to alphanumeric characters, spaces, underscores, and hyphens, and explicitly removes path traversal sequences like `../` and `..\`.
