# Firebase Setup Guide

Complete guide to set up Firebase for Food Truck Compliance.

## Table of Contents
1. [Create Firebase Project](#1-create-firebase-project)
2. [Get Configuration Values](#2-get-configuration-values)
3. [Enable Firebase Services](#3-enable-firebase-services)
4. [Configure Security Rules](#4-configure-security-rules)
5. [Set Up Environment Variables](#5-set-up-environment-variables)
6. [Test the Connection](#6-test-the-connection)
7. [Troubleshooting](#7-troubleshooting)
8. [Phone authentication (Firebase + Expo reCAPTCHA)](#8-phone-authentication-firebase--expo-recaptcha)
9. [Firebase App Check](#9-firebase-app-check)

---

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `Food Truck Compliance` (or your preferred name)
4. Click **Continue**
5. **Google Analytics** (optional):
   - Choose whether to enable Google Analytics
   - If enabled, select or create an Analytics account
   - Click **Continue**
6. Click **Create project**
7. Wait for project creation to complete (~30 seconds)
8. Click **Continue**

---

## 2. Get Configuration Values

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register your app:
   - **App nickname**: `Food Truck Compliance` (or any name)
   - **Firebase Hosting** (optional): Leave unchecked for now
   - Click **Register app**
6. Copy the configuration object that appears:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**Keep this window open** - you'll need these values in the next step.

---

## 3. Enable Firebase Services

### 3.1 Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

### 3.2 Enable Firestore Database

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. **⚠️ SECURITY WARNING**: 
   - **Test mode** makes your database publicly readable/writable for 30 days, allowing anyone to access or modify data.
   - **Recommended**: Choose **"Start in production mode"** and immediately apply security rules from Section 4 below.
   - **Alternative**: If using test mode, complete Section 4 (security rules) immediately before uploading any sensitive data.
4. Click **"Next"**
5. Select a **location** (choose closest to your users)
   - Recommended: `us-central1` (Iowa) or `us-east1` (South Carolina) for US
   - For other regions, choose the closest option
6. Click **"Enable"**
7. Wait for database creation (~1 minute)

### 3.3 Enable Firebase Storage

1. In Firebase Console, go to **Storage** (left sidebar)
2. Click **"Get started"**
3. **⚠️ SECURITY WARNING**: 
   - **Test mode** makes your storage publicly readable/writable for 30 days, allowing anyone to access or modify files.
   - **Recommended**: Choose **"Start in production mode"** and immediately apply security rules from Section 4 below.
   - **Alternative**: If using test mode, complete Section 4 (security rules) immediately before uploading any sensitive files.
4. Click **"Next"**
5. Select the **same location** as Firestore (for consistency)
6. Click **"Done"**

---

## 4. Configure Security Rules

**⚠️ IMPORTANT**: Apply these security rules immediately after enabling Firestore and Storage, especially if you chose test mode. Do not upload sensitive data until rules are deployed.

### 4.1 Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click on **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can only access their own document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Documents collection - users can only access their own documents
    match /documents/{documentId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Checklist items collection - users can only access their own items
    match /checklistItems/{itemId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Click **"Publish"**

### 4.2 Storage Security Rules

1. In Firebase Console, go to **Storage**
2. Click on **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // User documents - users can only access their own documents
    match /user_documents/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profile pictures - users can only access their own profile
    match /user_profiles/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Checklist photos - users can only access their own photos
    match /checklist_photos/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Incident photos - users can only access their own photos
    match /incident_photos/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Certifications - users can only access their own certifications
    match /certifications/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

4. Click **"Publish"**

---

## 5. Set Up Environment Variables

1. In your project root directory, create a `.env` file (if it doesn't exist)
2. Copy the template from `.env.example`:

```bash
cp .env.example .env
```

3. Open `.env` in a text editor
4. Replace the placeholder values with your actual Firebase config:

```env
# Firebase Configuration
# Get these values from: https://console.firebase.google.com/ > Project Settings > General > Your apps

# Firebase API Key
FIREBASE_API_KEY=AIzaSy...your-actual-api-key

# Firebase Auth Domain (usually: your-project-id.firebaseapp.com)
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com

# Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id

# Firebase Storage Bucket (usually: your-project-id.appspot.com)
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Firebase Messaging Sender ID
FIREBASE_MESSAGING_SENDER_ID=123456789012

# Firebase App ID
FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Important**: 
- Replace all placeholder values with your actual values from step 2
- Do NOT commit the `.env` file to git (it's already in `.gitignore`)
- Keep your API keys secure and never share them publicly

---

## 6. Test the Connection

1. **Restart your Expo dev server** (environment variables are loaded at startup):
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm start
   # or
   expo start
   ```

2. **Test Authentication**:
   - Open the app
   - Try to sign up with a new account
   - Check Firebase Console > Authentication to see if the user was created
   - Try logging in with the new account

3. **Test Firestore**:
   - After signing up, check Firebase Console > Firestore Database
   - You should see a `users` collection with your user document
   - Try uploading a document in the app
   - Check Firestore for a `documents` collection

4. **Test Storage**:
   - Try uploading a profile picture in the Profile screen
   - Check Firebase Console > Storage
   - You should see files in `user_profiles/{userId}/`

---

## 7. Troubleshooting

### Issue: "Firebase initialization error"

**Solution**: 
- Check that all values in `.env` are correct (no extra spaces, quotes, or typos)
- Restart the Expo dev server after changing `.env`
- Verify the API key is correct in Firebase Console

### Issue: "Permission denied" errors

**Solution**:
- Check that security rules are published (not just saved)
- Verify the user is authenticated (`request.auth != null`)
- Check that the user ID matches (`request.auth.uid == userId`)
- Review the security rules syntax in Firebase Console

### Issue: "Email already in use" but user doesn't exist

**Solution**:
- Check Firebase Console > Authentication
- The user might exist but not be visible in the list
- Try deleting the user from Firebase Console and signing up again

### Issue: Storage upload fails

**Solution**:
- Check Storage security rules are published
- Verify the storage path matches the rules pattern
- Check file size limits (10MB max)
- Verify file type is allowed (images: jpeg, png; documents: pdf, doc, docx) (application-level validation; not enforced by Storage security rules)

### Issue: Firestore queries return empty

**Solution**:
- Check that data was actually created (view in Firebase Console)
- Verify the collection name matches exactly (case-sensitive)
- Check that `userId` field matches the authenticated user's UID
- Review Firestore security rules

### Issue: Environment variables not loading

**Solution**:
- Ensure `.env` file is in the project root (same level as `package.json`)
- Restart Expo dev server completely (kill and restart)
- Check that `dotenv` is installed: `npm list dotenv`
- Verify `.env` file has no syntax errors (no spaces around `=`)

---

## 8. Phone authentication (Firebase + Expo reCAPTCHA)

The app implements phone sign-in in **`src/screens/auth/PhoneLoginScreen.js`** using the Firebase JS SDK (`PhoneAuthProvider`) and **`expo-firebase-recaptcha`** (`FirebaseRecaptchaVerifierModal`). Logic and error mapping live in **`src/services/auth.js`**. The UI **blocks** Expo Go and web with an explicit message; use a **development or production native build**.

**Never commit** API keys or service account JSON. Use `.env` (see `.env.example`) and rebuild after changing `app.config.js` `extra` fields.

### 8.1 Firebase Console — enable Phone provider

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **Build** → **Authentication** → **Sign-in method**.
3. Click **Phone** → turn **Enable** on → **Save**.
4. (Recommended for dev) In the same **Sign-in method** area, use **Phone numbers for testing** to add E.164 numbers and fixed 6-digit codes so SMS is not consumed during iteration.

### 8.2 Authorized domains (reCAPTCHA / web-based verifier)

1. **Authentication** → **Settings** → **Authorized domains**.
2. Ensure at least: **`your-project-id.firebaseapp.com`**, **`your-project-id.web.app`**, and for local web auth if needed **`localhost`**.
3. If you use a custom `authDomain`, add that domain here as well.
4. API keys: In Google Cloud Console, if the browser key is restricted, allow the domains above (Firebase docs: API key restrictions vs Auth).

### 8.3 Register apps to match `app.config.js` (no secrets in repo)

Values must match Firebase **Project settings** → **Your apps** (add Android / iOS app if missing):

| Build field | `app.config.js` location |
|-------------|---------------------------|
| Android package name | `expo.android.package` (e.g. `com.internalaggregator.app`) |
| iOS bundle identifier | `expo.ios.bundleIdentifier` |
| URL scheme (deep links) | `expo.scheme` (`foodtruckcompliance`) |

This project loads Firebase web config from **`expo.extra`** (populated from `.env` at build time via `dotenv` in `app.config.js`). After editing `.env`, restart Metro and **rebuild** native binaries (`npx expo run:android` / `run:ios`) so `extra` updates on device.

### 8.4 Android — SHA-1 / SHA-256 (required for real SMS)

Phone sign-in on Android expects your app’s signing certs registered on the **same** Firebase Android app entry as `android.package`.

1. Firebase Console → **Project settings** → **Your apps** → Android app.
2. **Add fingerprint**: SHA-1 and SHA-256 for:
   - **Debug**: e.g. `cd android && ./gradlew signingReport` (or `keytool` against your debug keystore).
   - **Release**: keystore you ship with (EAS/Play App Signing as applicable).
3. Save; wait a few minutes for propagation.
4. Rebuild the app: `npx expo run:android`

If SHA keys are wrong, Firebase often returns **`auth/app-not-authorized`** or **`auth/invalid-app-credential`** (mapped to friendly copy in the app).

### 8.5 iOS (optional)

1. Register the iOS app in Firebase with the **same** bundle ID as `expo.ios.bundleIdentifier`.
2. Phone / reCAPTCHA flows may need **APNs** / silent push configuration per Firebase’s current iOS phone auth docs; verify in Console if Apple sign-in or phone flows require extra setup.
3. Build: `npx expo run:ios`

### 8.6 Local build commands (native dev client)

`expo-firebase-recaptcha` relies on native code paths that are **not reliable in Expo Go**. The app gates phone sign-in when `executionEnvironment === storeClient` (Expo Go).

```bash
# Android — from repo root, .env present with FIREBASE_* keys
npx expo run:android

# iOS
npx expo run:ios
```

### 8.7 In-app flow (manual smoke test)

1. **Login** → **Sign In with Phone** (or open Phone route directly in dev).
2. If you see **“Phone sign-in unavailable”**, read the banner (Expo Go, web, or missing Firebase config).
3. Enter **E.164** number (e.g. `+15555550123`), **Send Code** — invisible reCAPTCHA on Android may run first; iOS may show a modal challenge.
4. Enter the **6-digit** SMS (or test code from Console), **Verify and Sign In**.

### 8.8 Common errors (mapped in `auth.js`)

| Code / symptom | What to check |
|----------------|----------------|
| `auth/invalid-phone-number` | E.164 with `+` and country code. |
| `auth/too-many-requests` / `auth/quota-exceeded` | Backoff; add Firebase **test** numbers; billing / SMS quota. |
| `auth/operation-not-allowed` | Phone provider enabled in Console. |
| `auth/app-not-authorized`, `auth/invalid-app-credential` | Android SHA-1/256, package name, rebuild. |
| `auth/unauthorized-domain` | Authorized domains list. |
| `ERR_FIREBASE_RECAPTCHA_ERROR` | Network; dev build not Expo Go; config / domains. |
| `ERR_FIREBASE_RECAPTCHA_CANCEL` | User closed the challenge — retry. |

---

## 9. Firebase App Check

App Check reduces abuse of Firestore and Storage by attaching a short-lived attestation token to requests. This project uses the **Firebase JS SDK** (`src/services/firebase.js`) with initialization in **`src/services/appCheck.js`**.

### 9.1 What the app does

| Build | Platform | Behavior |
|-------|----------|----------|
| **Development** (`__DEV__`) | Web, iOS, Android | **Debug provider**: `globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN` is set before `initializeAppCheck()`. If `FIREBASE_APPCHECK_DEBUG_TOKEN` is set in `.env`, that **string** is used as the debug secret; otherwise `true` so the SDK prints a token to Metro / Xcode / Logcat. Register that token under **Firebase Console → App Check → your app → Manage debug tokens**. |
| **Production** | **Web** | If `FIREBASE_APPCHECK_SITE_KEY` is in `.env` (surfaced as `expo.extra.firebaseAppCheckSiteKey`), the app uses **reCAPTCHA Enterprise** by default, or **reCAPTCHA v3** if `FIREBASE_APPCHECK_USE_V3=true`. **Do not** turn on Firestore/Storage **enforcement** until this key is configured and tokens verify in Console. |
| **Production** | **iOS / Android (native)** | **Deferred.** The JS SDK does not ship Device Check / Play Integrity. `initFirebaseAppCheck` **skips** initialization and logs a warning. **Do not enable App Check enforcement** for mobile in Firebase Console until you adopt a supported path (e.g. migrate data access to **`@react-native-firebase/firestore`** + **`@react-native-firebase/app-check`**, or serve tokens via a **Custom provider** backend). |

### 9.2 Environment variables (optional)

Add to `.env` as needed (see `.env.example`):

- `FIREBASE_APPCHECK_SITE_KEY` — Web production reCAPTCHA site key from App Check setup.
- `FIREBASE_APPCHECK_USE_V3=true` — Use `ReCaptchaV3Provider` instead of Enterprise.
- `FIREBASE_APPCHECK_DEBUG_TOKEN` — **Development only:** fixed UUID you paste into Console debug tokens (avoids a new random token every cold start when IndexedDB is missing).

Restart Expo after changing `.env`.

### 9.3 Enabling enforcement in Firebase Console

1. Complete debug-token registration for every developer machine (or shared token in `.env` for dev only — treat like a password; never ship in production builds you distribute).
2. For **web** production builds, set `FIREBASE_APPCHECK_SITE_KEY`, ship, and confirm requests succeed with App Check metrics.
3. For **native** production, leave enforcement **off** for Firestore/Storage until a native-capable provider is integrated (see table above).

---

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use production security rules** - Test mode is only for development
3. **Restrict API key usage** - In Firebase Console > Project Settings > General, you can restrict API keys by domain
4. **Monitor usage** - Check Firebase Console > Usage and billing regularly
5. **Set up alerts** - Configure billing alerts in Google Cloud Console
6. **Review security rules regularly** - Ensure they match your app's requirements

---

## Next Steps

After successful setup:

1. ✅ Test all features (signup, login, document upload, checklist creation)
2. ✅ Verify data appears in Firebase Console
3. ✅ Test security rules by trying to access other users' data (should fail)
4. ✅ Set up billing alerts if using paid tier
5. ✅ Enable Firebase App Check for **web** production when `FIREBASE_APPCHECK_SITE_KEY` is set; see [§9](#9-firebase-app-check). Defer native enforcement until a supported provider exists.

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

## Support

If you encounter issues not covered here:

1. Check Firebase Console for error messages
2. Review browser/Expo console logs
3. Verify all steps were completed correctly
4. Check Firebase status: https://status.firebase.google.com/
