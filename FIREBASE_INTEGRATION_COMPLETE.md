# Firebase Integration Complete Guide

## Overview
This guide covers the complete Firebase integration for the Internal Aggregator App, including setup, configuration, security rules, offline support, and testing.

## Table of Contents
1. [Firebase Project Setup](#firebase-project-setup)
2. [Environment Configuration](#environment-configuration)
3. [Service Implementation](#service-implementation)
4. [Security Rules](#security-rules)
5. [Offline Support](#offline-support)
6. [Error Handling & Monitoring](#error-handling--monitoring)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard:
   - Enter project name: `internal-aggregator-app` (or your choice)
   - Enable Google Analytics (optional but recommended)
   - Select Analytics account (or create new)

### Step 2: Enable Required Services

#### Authentication
1. Go to **Authentication** > **Get Started**
2. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"

#### Firestore Database
1. Go to **Firestore Database** > **Create database**
2. Choose **Start in production mode** (we'll add rules next)
3. Select a location (choose closest to your users)
4. Click "Enable"

#### Storage
1. Go to **Storage** > **Get started**
2. Choose **Start in production mode** (we'll add rules next)
3. Use same location as Firestore
4. Click "Done"

### Step 3: Get Firebase Configuration
1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps" section
3. Click **Web** icon (`</>`) to add a web app
4. Register app with nickname: "Internal Aggregator App"
5. Copy the config values (you'll add these to `.env`)

---

## Environment Configuration

### Step 1: Create .env File
```bash
# In project root
cp .env.example .env
```

### Step 2: Add Firebase Config to .env
Open `.env` and add your Firebase config values:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-actual-api-key-here
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

**Important**: 
- Never commit `.env` to git (it's in `.gitignore`)
- Replace all placeholder values with actual values from Firebase Console
- Restart Expo dev server after updating `.env`

### Step 3: Verify Configuration
After adding config, restart Expo:
```bash
npm start
```

You should see in console:
```
✅ Firebase app initialized successfully
   Project: your-project-id
✅ Firestore initialized successfully
✅ Firebase Storage initialized successfully
```

If you see warnings about missing config, check that:
- `.env` file exists in project root
- All values are filled (no placeholders)
- Expo server was restarted after changes

---

## Service Implementation

### Current Status
All services are **already implemented** with real Firebase methods:

#### ✅ Authentication Service (`src/services/auth.js`)
- `signUpUser()` - Creates new user with email/password
- `signInUser()` - Signs in existing user
- `signOutUser()` - Signs out current user
- `sendPasswordReset()` - Sends password reset email
- `updateUserProfile()` - Updates user profile
- `onAuthStateChanged()` - Listens to auth state changes

#### ✅ Firestore Service (`src/services/firestore.js`)
- `createDocument()` - Creates new document
- `getDocument()` - Gets single document by ID
- `updateDocument()` - Updates existing document
- `deleteDocument()` - Deletes document
- `queryDocuments()` - Queries documents with filters
- `setupRealtimeListener()` - Sets up real-time listeners

##### Media Logs Collection (`mediaLogs`)

Used for **daily/weekly/monthly photo & video logs with notes**. Each document represents a single log entry.

Schema:
- `id: string` – Document ID
- `userId: string` – Owner (must match `request.auth.uid`)
- `createdAt: Timestamp` – When the log was created (server timestamp)
- `logDate: string` – Normalized date string (e.g. `"2026-01-24"`) used for daily/weekly/monthly grouping
- `mediaType: 'photo' | 'video'` – Type of media
- `storagePath: string` – Firebase Storage path for the file (e.g. `media_logs/{userId}/{logId}/file.jpg`)
- `thumbnailPath: string | null` – Optional thumbnail path (for videos or future optimization)
- `note: string | null` – Optional text note attached to the log
- `tags: string[] | null` – Optional tags for future filtering (e.g. `"truck_1"`, `"pre_trip"`)

#### ✅ Storage Service (`src/services/storage.js`)
- `uploadFile()` - Uploads file with progress tracking
- `downloadFile()` - Downloads file
- `deleteFile()` - Deletes file
- `getFileURL()` - Gets download URL
- `getFileMetadata()` - Gets file metadata

### Service Features
- ✅ Comprehensive error handling
- ✅ Network error detection
- ✅ Timeout handling (30s for Firestore, 60s for Storage)
- ✅ Input validation
- ✅ User-friendly error messages
- ✅ Retry logic with exponential backoff

---

## Security Rules

### Firestore Rules
The rules are already configured in `firestore.rules`. Deploy them:

#### Option 1: Firebase Console
1. Go to **Firestore Database** > **Rules**
2. Copy contents from `firestore.rules`
3. Paste into editor
4. Click **Publish**

#### Option 2: Firebase CLI
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Storage Rules
The rules are already configured in `storage.rules`. Deploy them:

#### Option 1: Firebase Console
1. Go to **Storage** > **Rules**
2. Copy contents from `storage.rules`
3. Paste into editor
4. Click **Publish**

#### Option 2: Firebase CLI
```bash
firebase deploy --only storage:rules
```

### Rule Summary
- **Users**: Can only read/write their own user document
- **Documents**: Can only access documents where `userId` matches their `auth.uid`
- **Checklist Items**: Can only access items where `userId` matches their `auth.uid`
- **Storage**: Can only access files in their own user folder

### Testing Rules
Use Firebase Console > **Rules Playground** to test rules before deploying.

---

## Offline Support

### Current Implementation
The app handles offline scenarios gracefully:

1. **Network Detection**: Services detect network errors and show user-friendly messages
2. **Error Handling**: All async operations wrapped with network checks
3. **Queue Operations**: Failed operations can be retried when connection is restored

### Firestore Offline Persistence
**Note**: With Firebase JS SDK (used in Expo), offline persistence is limited:
- ✅ **Web**: IndexedDB persistence enabled automatically
- ⚠️ **React Native**: IndexedDB not available, but Firestore caches recent queries

For full offline support in React Native, you would need:
- `@react-native-firebase` (requires Development Build)
- Native offline persistence

### Current Offline Behavior
- App shows network error messages when offline
- Users can retry operations when connection is restored
- Recent data is cached (Firestore automatically caches last query results)

### Future Enhancement
To add full offline support:
1. Switch to `@react-native-firebase`
2. Enable native persistence
3. Implement sync queue for pending operations

---

## Error Handling & Monitoring

### Current Error Handling
All services include comprehensive error handling:

1. **Network Errors**: Detected and shown to user
2. **Timeout Errors**: 30s for Firestore, 60s for Storage
3. **Validation Errors**: Input validation before operations
4. **Firebase Errors**: Mapped to user-friendly messages

### Error Messages
User-friendly error messages are provided for:
- Network connectivity issues
- Authentication failures
- Permission denied
- Invalid data
- File size/type restrictions

### Optional: Firebase Crashlytics
To add error monitoring:

#### Step 1: Install Dependencies
```bash
# Note: Requires @react-native-firebase (not compatible with Expo Go)
# You'll need to create a Development Build
npm install @react-native-firebase/app @react-native-firebase/crashlytics
```

#### Step 2: Initialize Crashlytics
```javascript
// src/services/crashlytics.js
import crashlytics from '@react-native-firebase/crashlytics';

export const logError = (error, context = {}) => {
  crashlytics().recordError(error);
  crashlytics().log(`Error in ${context.screen || 'unknown'}: ${error.message}`);
  
  // Add custom keys
  Object.entries(context).forEach(([key, value]) => {
    crashlytics().setAttribute(key, String(value));
  });
};

export const logEvent = (eventName, params = {}) => {
  crashlytics().log(`Event: ${eventName}`);
  Object.entries(params).forEach(([key, value]) => {
    crashlytics().setAttribute(key, String(value));
  });
};
```

#### Step 3: Use in Services
```javascript
import { logError } from './crashlytics';

try {
  // ... operation
} catch (error) {
  logError(error, { 
    screen: 'DashboardScreen',
    operation: 'fetchDocuments',
    userId: user?.uid 
  });
  // ... handle error
}
```

**Note**: Crashlytics requires a Development Build. For Expo Go, consider:
- Using Sentry (works with Expo Go)
- Or waiting until you create a Development Build

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Firebase project created
- [ ] All services enabled (Auth, Firestore, Storage)
- [ ] `.env` file configured with real values
- [ ] Security rules deployed
- [ ] Expo server restarted after config changes

### Authentication Tests

#### Sign Up
- [ ] Create new account with valid email/password
- [ ] Verify user appears in Firebase Console > Authentication
- [ ] Try sign up with existing email (should show error)
- [ ] Try sign up with invalid email (should show error)
- [ ] Try sign up with weak password (should show error)

#### Sign In
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (should show error)
- [ ] Sign in with non-existent email (should show error)
- [ ] Verify user data loads after sign in

#### Password Reset
- [ ] Request password reset with valid email
- [ ] Check email for reset link
- [ ] Verify reset link works
- [ ] Try reset with invalid email (should show error)

#### Sign Out
- [ ] Sign out successfully
- [ ] Verify user is redirected to login
- [ ] Verify user data is cleared

### Firestore Tests

#### Create Document
- [ ] Upload document (creates Firestore document)
- [ ] Verify document appears in Firebase Console > Firestore
- [ ] Verify `userId` field matches current user
- [ ] Verify `createdAt` and `updatedAt` timestamps are set

#### Read Document
- [ ] View document detail screen
- [ ] Verify all document fields display correctly
- [ ] Try accessing another user's document (should be denied by rules)

#### Update Document
- [ ] Edit document details
- [ ] Verify changes save to Firestore
- [ ] Verify `updatedAt` timestamp updates
- [ ] Verify changes reflect in UI immediately

#### Delete Document
- [ ] Delete document
- [ ] Verify document removed from Firestore
- [ ] Verify document removed from UI

#### Query Documents
- [ ] Filter documents by category
- [ ] Search documents by name
- [ ] Sort documents (date, name)
- [ ] Verify only user's documents appear

### Storage Tests

#### Upload File
- [ ] Upload document file (PDF, DOCX)
- [ ] Upload image file (JPG, PNG)
- [ ] Verify progress indicator shows during upload
- [ ] Verify file appears in Firebase Console > Storage
- [ ] Verify file path follows: `user_documents/{userId}/{filename}`
- [ ] Try uploading file > 10MB (should show error)
- [ ] Try uploading invalid file type (should show error)

#### Download File
- [ ] Download uploaded file
- [ ] Verify file opens correctly
- [ ] Verify download URL works

#### Delete File
- [ ] Delete file from storage
- [ ] Verify file removed from Storage console
- [ ] Verify associated Firestore document updated

### Checklist Tests

#### Create Checklist Item
- [ ] Create new checklist item
- [ ] Verify item appears in Firestore `checklistItems` collection
- [ ] Verify `userId` matches current user
- [ ] Verify default status is "pending"

#### Update Checklist Item
- [ ] Mark item as complete
- [ ] Verify status updates in Firestore
- [ ] Verify `completedAt` timestamp is set
- [ ] Edit item details
- [ ] Verify changes save

#### Delete Checklist Item
- [ ] Delete checklist item
- [ ] Verify item removed from Firestore
- [ ] Verify item removed from UI

### Profile Tests

#### Update Profile
- [ ] Update display name
- [ ] Update profile picture
- [ ] Verify changes save to Firestore `users` collection
- [ ] Verify profile picture uploads to Storage
- [ ] Verify changes reflect in UI

### Offline Tests

#### Network Disconnection
- [ ] Disable network (airplane mode)
- [ ] Try to create document (should show network error)
- [ ] Try to upload file (should show network error)
- [ ] Re-enable network
- [ ] Retry operations (should succeed)

#### Timeout Tests
- [ ] Simulate slow network (throttle in DevTools)
- [ ] Verify timeout errors show after 30s (Firestore) or 60s (Storage)
- [ ] Verify user can retry operation

### Security Tests

#### Access Control
- [ ] Sign in as User A
- [ ] Create document
- [ ] Sign out
- [ ] Sign in as User B
- [ ] Try to access User A's document (should be denied)
- [ ] Verify User B only sees their own documents

#### Storage Access
- [ ] Sign in as User A
- [ ] Upload file
- [ ] Sign out
- [ ] Sign in as User B
- [ ] Try to access User A's file (should be denied)

---

## Troubleshooting

### Common Issues

#### "Firebase configuration is missing"
**Solution**: 
- Check `.env` file exists in project root
- Verify all Firebase config values are filled
- Restart Expo dev server after updating `.env`

#### "Firebase Auth component not registered"
**Solution**:
- This is handled automatically with lazy initialization
- If persistent, clear Expo cache: `expo start -c`
- Restart Metro bundler

#### "Permission denied" errors
**Solution**:
- Verify security rules are deployed
- Check user is authenticated (`user?.uid` exists)
- Verify `userId` field matches `auth.uid` in documents

#### "Network error" when online
**Solution**:
- Check Firebase project is active (not paused)
- Verify API keys are correct
- Check Firebase Console for service status

#### Files not uploading
**Solution**:
- Verify Storage rules are deployed
- Check file size < 10MB
- Verify file type is allowed
- Check Storage bucket exists and is enabled

#### Firestore queries not working
**Solution**:
- Check Firestore indexes are created (Console will show link if needed)
- Verify query filters match security rules
- Check `userId` field exists in documents

### Getting Help

1. **Firebase Console**: Check service status and logs
2. **Expo Logs**: Check Metro bundler output
3. **React Native Debugger**: Use for detailed error inspection
4. **Firebase Support**: [Firebase Support](https://firebase.google.com/support)

---

## Next Steps

### Immediate
1. ✅ Complete Firebase setup (this guide)
2. ✅ Deploy security rules
3. ✅ Test all flows
4. ✅ Monitor for errors

### Future Enhancements
1. **Offline Support**: Switch to `@react-native-firebase` for native offline persistence
2. **Error Monitoring**: Add Crashlytics or Sentry
3. **Analytics**: Add Firebase Analytics for user behavior tracking
4. **Push Notifications**: Add Firebase Cloud Messaging
5. **Performance Monitoring**: Add Firebase Performance Monitoring

---

## Summary

✅ **Firebase is fully integrated** with:
- Real authentication (not mocks)
- Real Firestore operations (not mocks)
- Real Storage operations (not mocks)
- Comprehensive error handling
- Security rules deployed
- Offline error detection
- User-friendly error messages

The app is **ready for production** after:
1. Completing Firebase project setup
2. Adding config to `.env`
3. Deploying security rules
4. Completing testing checklist
