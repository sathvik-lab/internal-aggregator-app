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
5. ✅ Consider enabling Firebase App Check for additional security

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
