# Switch from Mock to Real Firebase

This guide will help you switch the app from using mock data to real Firebase.

## Prerequisites

1. ✅ Firebase project created
2. ✅ Firebase services enabled (Auth, Firestore, Storage)
3. ✅ `.env` file created with Firebase config values
4. ✅ Security rules configured (see `FIREBASE_SETUP.md`)

## Quick Answer

**You need 3 things:**
1. **Firebase keys in `.env`** ✅
2. **Enable Firebase services** ✅ (Auth, Firestore, Storage)
3. **Uncomment real Firebase code** in service files (see below)

---

## Step-by-Step: Switch to Real Firebase

### Step 1: Verify `.env` file

Make sure your `.env` file has all 6 Firebase config values:

```env
FIREBASE_API_KEY=your-actual-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef
```

### Step 2: Update Service Files

The service files have the real Firebase code ready but commented out. You need to:

#### A. Update `src/services/auth.js`

1. **Uncomment the imports** (lines 15-24):
   ```javascript
   import { auth } from './firebase';
   import {
     createUserWithEmailAndPassword,
     signInWithEmailAndPassword,
     signOut,
     sendPasswordResetEmail,
     updateProfile,
     onAuthStateChanged,
   } from 'firebase/auth';
   ```

2. **Remove or comment out** the mock imports (line 13):
   ```javascript
   // import { MOCK_USER } from '../utils/mockData';
   ```

3. **Replace each function** with real Firebase calls:
   - `signUpUser`: Uncomment lines 61-64, remove mock code (lines 66-110)
   - `signInUser`: Uncomment lines 134-137, remove mock code
   - `signOutUser`: Uncomment lines 193-196, remove mock code
   - `resetPassword`: Uncomment lines 222-225, remove mock code
   - `getCurrentUser`: Uncomment lines 256-258, remove mock code
   - `updateUserProfile`: Uncomment lines 272-277, remove mock code
   - `onAuthStateChanged`: Uncomment lines 317-325, remove mock code

#### B. Update `src/services/firestore.js`

1. **Uncomment the imports** (lines 22-39):
   ```javascript
   import { db } from './firebase';
   import {
     collection,
     doc,
     getDoc,
     getDocs,
     setDoc,
     updateDoc,
     deleteDoc,
     query,
     where,
     orderBy,
     limit,
     onSnapshot,
     Timestamp,
     serverTimestamp,
   } from 'firebase/firestore';
   ```

2. **Remove or comment out** mock imports (lines 14-20)

3. **Replace each function** with real Firestore calls:
   - `createDocument`: Uncomment lines 51-58, remove mock code
   - `getDocument`: Uncomment lines 98-104, remove mock code
   - `updateDocument`: Uncomment lines 166-171, remove mock code
   - `deleteDocument`: Uncomment lines 202-207, remove mock code
   - `queryDocuments`: Uncomment lines 237-231, remove mock code
   - `setupRealtimeListener`: Uncomment lines 339-365, remove mock code

#### C. Update `src/services/storage.js`

1. **Uncomment the imports** (lines 16-26):
   ```javascript
   import { storage } from './firebase';
   import {
     ref,
     uploadBytes,
     uploadBytesResumable,
     getDownloadURL,
     deleteObject,
     getBytes,
     getMetadata,
   } from 'firebase/storage';
   ```

2. **Replace each function** with real Storage calls:
   - `uploadFile`: Uncomment lines 41-75, remove mock code
   - `downloadFile`: Uncomment lines 142-147, remove mock code
   - `deleteFile`: Uncomment lines 185-190, remove mock code
   - `getFileURL`: Uncomment lines 224-229, remove mock code
   - `getFileMetadata`: Uncomment lines 267-272, remove mock code

### Step 3: Restart Expo

After making changes, restart your Expo dev server:

```bash
# Stop current server (Ctrl+C)
npm start
# or
expo start
```

### Step 4: Test

1. **Test Authentication**:
   - Try signing up with a new account
   - Check Firebase Console > Authentication to see the user
   - Try logging in

2. **Test Firestore**:
   - Upload a document
   - Check Firebase Console > Firestore Database
   - Create a checklist item
   - Verify data appears in Firestore

3. **Test Storage**:
   - Upload a profile picture
   - Check Firebase Console > Storage
   - Verify file appears in Storage

---

## Alternative: Automated Script

I can create a script that automatically:
- Uncomments all real Firebase code
- Comments out mock code
- Removes mock imports

Would you like me to create this automated migration script?

---

## What Works After Switching

✅ **Authentication**: Real user signup, login, logout, password reset  
✅ **Firestore**: Real database operations, real-time listeners  
✅ **Storage**: Real file uploads, downloads, deletions  
✅ **User Profiles**: Stored in Firestore `users` collection  
✅ **Documents**: Stored in Firestore `documents` collection  
✅ **Checklists**: Stored in Firestore `checklistItems` collection  

---

## Troubleshooting

### "Firebase App not initialized"
- Check that `.env` file exists and has correct values
- Restart Expo dev server
- Verify `firebase.js` is loading config correctly

### "Permission denied" errors
- Check security rules are published (not just saved)
- Verify user is authenticated
- Check rules match your data structure

### "Collection not found"
- Collections are created automatically on first write
- Check collection name spelling (case-sensitive)
- Verify Firestore is enabled in Firebase Console

---

## Summary

**Minimum requirements:**
1. ✅ Firebase keys in `.env`
2. ✅ Services enabled in Firebase Console
3. ✅ Uncomment real Firebase code in service files

The code is **already written** - you just need to **uncomment it** and **remove the mock code**.
