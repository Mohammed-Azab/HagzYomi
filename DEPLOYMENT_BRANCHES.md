# 🏟️ HagzYomi - Deployment Branches with Git Worktrees

This repository uses **Git Worktrees** to link deployment directories to their respective branches, making development and deployment seamless.

## 📋 Repository Structure

```
HagzYomi/                          # Main repository (main branch)
├── github-pages-deploy/           # 🌐 Linked to github-pages branch
├── localhost-deploy/              # 💻 Linked to localhost branch  
├── vercel-deploy/                 # ☁️ Linked to vercel branch
├── DEPLOYMENT_BRANCHES.md         # This documentation
└── README.md                      # Main project documentation
```

## 🔗 Git Worktree Benefits

- **Live sync:** Changes in directories automatically reflect in their branches
- **No copying:** Direct branch access through directories  
- **Parallel work:** Develop on different platforms simultaneously
- **Clean structure:** Each deployment method isolated but accessible

## 📋 Branch Structure

### 🌐 **`github-pages` Branch** → `github-pages-deploy/`
- **Purpose:** GitHub Pages deployment with Firebase cloud database
- **Structure:** Uses `/docs` directory for GitHub Pages recognition  
- **Database:** Firebase Firestore (cloud-based for multi-device access)
- **Features:** Complete Arabic RTL booking system with admin panel
- **Deploy:** Enable GitHub Pages from `/docs` folder in repository settings

```
github-pages-deploy/docs/
├── index.html          # Main booking page
├── admin.html          # Admin dashboard
├── admin-login.html    # Admin login
├── script.js          # Main JavaScript with Firebase
├── admin.js           # Admin panel functionality
├── styles.css         # Arabic RTL styling
├── firebase-config.js # Firebase configuration
└── README.md          # Deployment instructions
```

### 💻 **`localhost` Branch** → `localhost-deploy/`
- **Purpose:** Local development environment
- **Structure:** Node.js + Express.js backend in root directory
- **Database:** JSON file-based storage (`data/bookings.json`)
- **Features:** Full CRUD operations, PDF/Excel/CSV exports
- **Deploy:** `cd localhost-deploy && npm install && npm start`

```
localhost-deploy/
├── server.js          # Express.js backend
├── package.json       # Node.js dependencies
├── index.html         # Frontend pages
├── admin.html
├── script.js          # Frontend JavaScript
├── styles.css         # Styling
└── data/              # JSON database
```

### ☁️ **`vercel` Branch** → `vercel-deploy/`
- **Purpose:** Vercel serverless deployment
- **Structure:** Serverless functions with static files
- **Database:** In-memory storage (resets on cold starts)
- **Features:** Zero-config deployment, serverless optimization
- **Deploy:** Connect `vercel-deploy/` to Vercel

```
vercel-deploy/
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
1. Work in `github-pages-deploy/` directory (linked to github-pages branch)
2. Configure Firebase (see `github-pages-deploy/docs/FIREBASE_SETUP.md`)
3. Push changes: `cd github-pages-deploy && git add . && git commit -m "Update" && git push`
4. Enable GitHub Pages from `/docs` folder in repo settings
5. Access via: `https://mohammed-azab.github.io/HagzYomi/`

### Local Development
1. Work in `localhost-deploy/` directory (linked to localhost branch)
2. Run: `cd localhost-deploy && npm install && npm start`
3. Access via: `http://localhost:3000`
4. Push changes: `cd localhost-deploy && git add . && git commit -m "Update" && git push`

### Vercel Deployment
1. Work in `vercel-deploy/` directory (linked to vercel branch)
2. Connect `vercel-deploy/` directory to Vercel
3. Deploy with zero configuration
4. Push changes: `cd vercel-deploy && git add . && git commit -m "Update" && git push`
5. Access via: `https://your-project.vercel.app`

## 🔧 Managing Git Worktrees

### Create worktrees (already done):
```bash
git worktree add github-pages-deploy github-pages
git worktree add localhost-deploy localhost  
git worktree add vercel-deploy vercel
```

### View worktrees:
```bash
git worktree list
```

### Remove worktrees (if needed):
```bash
git worktree remove github-pages-deploy
git worktree remove localhost-deploy
git worktree remove vercel-deploy
```

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
