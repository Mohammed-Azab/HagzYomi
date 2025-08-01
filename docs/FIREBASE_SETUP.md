# 🔥 Firebase Setup Guide for HagzYomi

This guide will help you set up Firebase Firestore as your cloud database so multiple people can access the same bookings from different devices.

## 📋 Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Enter project name**: `hagz-yomi` (or any name you prefer)
4. **Disable Google Analytics** (not needed for this project)
5. **Click "Create project"**

## 🗄️ Step 2: Setup Firestore Database

1. **In your Firebase project, click "Firestore Database"**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (allows read/write for 30 days)
4. **Select location**: Choose closest to your location (e.g., `asia-south1` for Middle East)
5. **Click "Done"**

## 🔧 Step 3: Get Firebase Configuration

1. **In Firebase Console, click the gear icon ⚙️ → "Project settings"**
2. **Scroll down to "Your apps" section**
3. **Click the web icon `</>` to add a web app**
4. **Enter app name**: `HagzYomi Web`
5. **Check "Also set up Firebase Hosting"** (optional)
6. **Click "Register app"**
7. **Copy the configuration object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

## 📝 Step 4: Update Firebase Config File

1. **Open the file**: `docs/firebase-config.js`
2. **Replace the placeholder config** with your actual Firebase config:

```javascript
// Firebase Configuration
// Replace with your own Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collection reference
const bookingsCollection = db.collection('bookings');

console.log('Firebase initialized successfully');
```

## 🔒 Step 5: Configure Security Rules (Important!)

1. **In Firebase Console, go to "Firestore Database"**
2. **Click "Rules" tab**
3. **Replace the rules with this**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to bookings collection
    match /bookings/{document} {
      allow read, write: if true;
    }
  }
}
```

4. **Click "Publish"**

⚠️ **Note**: These rules allow anyone to read/write. For production, you should implement proper authentication.

## 🚀 Step 6: Deploy to GitHub Pages

1. **Commit your changes**:
```bash
git add docs/firebase-config.js
git commit -m "Configure Firebase for shared cloud database"
git push origin main
```

2. **Your website will automatically update on GitHub Pages**

## ✅ Step 7: Test the Setup

1. **Visit your GitHub Pages site**
2. **Make a booking** - it should save to Firebase
3. **Open the site on another device** (your uncle's phone)
4. **Check if the booking appears** - if yes, it's working!
5. **In Firebase Console → Firestore Database**, you should see your bookings

## 📱 Benefits of Firebase Setup

✅ **Shared Database**: All devices see the same bookings
✅ **Real-time Updates**: Changes appear instantly across devices  
✅ **Free Tier**: Up to 1GB storage and 50k reads/day free
✅ **Automatic Backups**: Google handles data backup
✅ **Scalable**: Can handle thousands of bookings
✅ **Works Offline**: Firebase caches data locally

## 🎯 Usage Instructions

### For Customers:
- Visit your GitHub Pages URL
- Book slots normally - data saves to cloud

### For Admins:
- Access admin panel from any device
- All bookings visible from all devices
- Export reports work the same way

### For Your Uncle:
- Give him the GitHub Pages URL
- He can view and make bookings from his phone
- All bookings will be shared with your admin panel

## 🔧 Troubleshooting

**If bookings don't appear:**
1. Check browser console for errors (F12)
2. Verify Firebase config is correct
3. Check Firestore security rules are published
4. Make sure internet connection is working

**If you see "Firebase not defined":**
1. Check that Firebase CDN scripts are loading
2. Verify firebase-config.js is included in HTML

**Performance:**
- Firebase free tier: 50k reads + 20k writes per day
- More than enough for typical court booking usage

## 💰 Cost Information

**Firebase Free Tier includes:**
- 1 GB stored data
- 50,000 document reads per day  
- 20,000 document writes per day
- 20,000 document deletes per day

For a small football court, this should be more than sufficient!

---

After completing this setup, your booking system will work as a shared cloud database that your uncle and anyone else can access from their devices! 🎉
