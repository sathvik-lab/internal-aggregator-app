# Firebase Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow setup wizard

### 2. Enable Services
- **Authentication**: Enable Email/Password
- **Firestore**: Create database (production mode)
- **Storage**: Get started (production mode)

### 3. Get Config
1. Project Settings > General > Your apps
2. Add Web app (`</>` icon)
3. Copy config values

### 4. Add to .env
```bash
cp .env.example .env
# Edit .env and paste your Firebase config values
```

### 5. Deploy Security Rules
- **Firestore**: Copy `firestore.rules` to Console > Firestore > Rules > Publish
- **Storage**: Copy `storage.rules` to Console > Storage > Rules > Publish

### 6. Restart Expo
```bash
npm start
```

✅ **Done!** Your app is now connected to Firebase.

---

## 📋 Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] `.env` file created with real values
- [ ] Security rules deployed
- [ ] Expo server restarted
- [ ] Console shows: "✅ Firebase app initialized successfully"

---

## 🧪 Quick Test

1. **Sign Up**: Create a new account
2. **Check Console**: Verify user appears in Authentication
3. **Upload Document**: Upload a file
4. **Check Firestore**: Verify document appears in `documents` collection
5. **Check Storage**: Verify file appears in Storage

---

## 📚 Full Documentation

- **Complete Guide**: See `FIREBASE_INTEGRATION_COMPLETE.md`
- **Indexes**: See `FIRESTORE_INDEXES.md`
- **Troubleshooting**: See integration guide troubleshooting section

---

## ⚠️ Common Issues

### "Firebase configuration is missing"
→ Check `.env` file exists and has real values (not placeholders)

### "Permission denied"
→ Deploy security rules in Firebase Console

### "Index required"
→ Click link in error message to create index automatically

---

## 🎯 Next Steps

1. Complete testing checklist (see `FIREBASE_INTEGRATION_COMPLETE.md`)
2. Create required Firestore indexes (see `FIRESTORE_INDEXES.md`)
3. Test all features end-to-end
4. Monitor for errors in Firebase Console

---

**Need Help?** See `FIREBASE_INTEGRATION_COMPLETE.md` for detailed instructions.
