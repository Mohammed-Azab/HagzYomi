# 🌐 GitHub Pages Version - HagzYomi

**Static website with Firebase cloud database**

## ✨ Features
- 🔥 **Firebase Firestore** for shared cloud database
- 📱 **Multi-device access** - your uncle can use from his phone
- 🆓 **Free hosting** on GitHub Pages
- 📊 **Real-time sync** across all devices
- 📄 **Export reports** (PDF/Excel/CSV)

## 🚀 Setup Instructions

### 1. Enable GitHub Pages
1. Go to: https://github.com/Mohammed-Azab/HagzYomi/settings/pages
2. Source: "Deploy from a branch"
3. Branch: "main"
4. Folder: "/github-pages"

### 2. Setup Firebase (Required)
1. **Read the guide**: `FIREBASE_SETUP.md`
2. **Create Firebase project** at https://console.firebase.google.com/
3. **Update config** in `firebase-config.js`

### 3. Access Your Website
- **Main site**: `https://mohammed-azab.github.io/HagzYomi/`
- **Admin panel**: `https://mohammed-azab.github.io/HagzYomi/admin-login.html`
- **Password**: `admin123`

## 📁 Files Structure
```
github-pages/
├── index.html              # Main booking page
├── admin-login.html        # Admin login
├── admin.html              # Admin dashboard
├── firebase-config.js      # Firebase setup (EDIT THIS!)
├── script.js               # Main functionality
├── admin.js                # Admin functionality
├── styles.css              # All styling
└── FIREBASE_SETUP.md       # Setup guide
```

## 🎯 Benefits
✅ **Shared database** - Multiple devices see same data
✅ **Free hosting** - GitHub Pages + Firebase free tier
✅ **No server needed** - Pure client-side with cloud database
✅ **Mobile friendly** - Perfect for your uncle's phone
✅ **Real-time updates** - Changes appear instantly

## 🔧 Customization
Edit these files to customize:
- `firebase-config.js` - Firebase connection
- `script.js` - Court settings (prices, hours, etc.)
- `styles.css` - Colors and design

## 📱 Perfect For
- Multiple users accessing from different devices
- Remote management (you and your uncle)
- Professional cloud infrastructure
- Zero maintenance required
