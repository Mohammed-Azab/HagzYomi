# 🏟️ HagzYomi - Deployment Branches

This repository has been organized into separate branches for different hosting platforms to make deployment easier and cleaner.

## 📋 Branch Structure

### 🌐 **`github-pages` Branch**
- **Purpose:** GitHub Pages deployment with Firebase cloud database
- **Structure:** Uses `/docs` directory for GitHub Pages recognition
- **Database:** Firebase Firestore (cloud-based for multi-device access)
- **Features:** Complete Arabic RTL booking system with admin panel
- **Deploy:** Enable GitHub Pages from `/docs` folder in repository settings

```
docs/
├── index.html          # Main booking page
├── admin.html          # Admin dashboard
├── admin-login.html    # Admin login
├── script.js          # Main JavaScript with Firebase
├── admin.js           # Admin panel functionality
├── styles.css         # Arabic RTL styling
├── firebase-config.js # Firebase configuration
└── README.md          # Deployment instructions
```

### 💻 **`localhost` Branch**
- **Purpose:** Local development environment
- **Structure:** Node.js + Express.js backend in root directory
- **Database:** JSON file-based storage (`data/bookings.json`)
- **Features:** Full CRUD operations, PDF/Excel/CSV exports
- **Deploy:** `npm install && npm start`

```
Root directory contains:
├── server.js          # Express.js backend
├── package.json       # Node.js dependencies
├── index.html         # Frontend pages
├── admin.html
├── script.js          # Frontend JavaScript
├── styles.css         # Styling
└── data/              # JSON database
```

### ☁️ **`vercel` Branch**
- **Purpose:** Vercel serverless deployment
- **Structure:** Serverless functions with static files
- **Database:** In-memory storage (resets on cold starts)
- **Features:** Zero-config deployment, serverless optimization
- **Deploy:** Connect to Vercel and deploy

```
Root directory contains:
├── server.js          # Express.js serverless function
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies
├── index.html         # Static files
├── admin.html
├── script.js
└── styles.css
```

## 🚀 Quick Deployment Guide

### GitHub Pages (Recommended for Production)
1. Switch to `github-pages` branch
2. Configure Firebase (see `docs/FIREBASE_SETUP.md`)
3. Enable GitHub Pages from `/docs` folder in repo settings
4. Access via: `https://mohammed-azab.github.io/HagzYomi/`

### Local Development
1. Switch to `localhost` branch
2. Run: `npm install && npm start`
3. Access via: `http://localhost:3000`

### Vercel Deployment
1. Switch to `vercel` branch
2. Connect repository to Vercel
3. Deploy with zero configuration
4. Access via: `https://your-project.vercel.app`

## 🔧 Features Available in All Versions

- ✅ Arabic RTL interface
- ✅ Football court booking system
- ✅ Time slot management
- ✅ Admin authentication
- ✅ Booking management (view/delete)
- ✅ Export reports (PDF/Excel/CSV)
- ✅ Date range filtering
- ✅ Mobile-responsive design
- ✅ Real-time validation
- ✅ Egyptian currency (جنيه)

## 📞 Contact

**Developer:** Mohammed Azab  
**Email:** Mohammed@azab.io  
**Copyright:** © 2025 Mohammed Azab. All rights reserved.

---
Choose the branch that best fits your deployment needs! 🎯
