# 🚀 Deployment Branches Guide

## Overview
This repository uses **Git Worktrees** to manage multiple deployment methods. Each deployment directory is linked to its own branch.

## 🌳 Git Worktree Structure

```
HagzYomi/                          # main branch
├── github-pages-deploy/           # github-pages branch
├── localhost-deploy/              # localhost branch  
├── railway-deploy/                # railway branch
└── vercel-deploy/                 # vercel branch
```

---

## 🌐 GitHub Pages + Firebase Deployment
**Branch:** `github-pages` | **Directory:** `github-pages-deploy/`

### Features
- ✅ Static hosting on GitHub Pages
- ✅ Firebase Firestore cloud database
- ✅ Multi-device access capability
- ✅ Perfect for your uncle's phone access
- ✅ 100% free hosting

### Setup Steps
1. **Navigate to deployment:**
   ```bash
   cd github-pages-deploy/
   ```

2. **Firebase Configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Firestore database
   - Get config keys
   - Update `docs/js/firebase-config.js`

3. **GitHub Pages Setup:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `github-pages`
   - Folder: `/docs`
   - Save

4. **Access:** `https://yourusername.github.io/HagzYomi`

### Database Structure
```javascript
// Firestore collections
bookings: {
  date: string,
  time: string,
  name: string,
  phone: string,
  price: number
}
```

---

## 🚂 Railway.app Deployment
**Branch:** `railway` | **Directory:** `railway-deploy/`

### Features
- ✅ Full Node.js backend hosting
- ✅ $5/month free credit (covers app costs)
- ✅ Automatic deployments from branch
- ✅ Professional hosting platform
- ✅ 5-minute setup

### Setup Steps
1. **Navigate to deployment:**
   ```bash
   cd railway-deploy/
   ```

2. **Railway Setup:**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - New Project → Deploy from GitHub repo
   - Select your repository
   - **IMPORTANT:** Change branch to `railway`
   - Deploy

3. **Environment Variables (if needed):**
   ```
   PORT=3000
   NODE_ENV=production
   ```

4. **Access:** Railway will provide a live URL

### Database
- File-based JSON storage
- Automatic backup system
- Data persists between deployments

---

## 💻 Local Development
**Branch:** `localhost` | **Directory:** `localhost-deploy/`

### Features
- ✅ Full Node.js + Express.js backend
- ✅ File-based database (JSON)
- ✅ Hot reloading for development
- ✅ All features work offline
- ✅ Perfect for testing and development

### Setup Steps
1. **Navigate to deployment:**
   ```bash
   cd localhost-deploy/
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

4. **Access:** `http://localhost:3000`

### Database
- `data/bookings.json` - All booking data
- `data/backup/` - Automatic backups
- Data persists locally

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

---

## ☁️ Vercel Serverless Deployment
**Branch:** `vercel` | **Directory:** `vercel-deploy/`

### Features
- ✅ Serverless functions
- ✅ Global edge deployment
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Fast global CDN

### Setup Steps
1. **Navigate to deployment:**
   ```bash
   cd vercel-deploy/
   ```

2. **Vercel Setup:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - **IMPORTANT:** Change branch to `vercel`
   - Deploy

3. **Configuration:**
   - Uses `vercel.json` for routing
   - Serverless functions in `/api`

4. **Access:** Vercel will provide a live URL

### Database
- File-based with Vercel's filesystem
- Consider external database for production

---

## 🔄 Working with Branches

### Switch Between Deployments
```bash
# Work on Railway version
cd railway-deploy/
git status  # Shows: On branch railway

# Work on GitHub Pages version  
cd ../github-pages-deploy/
git status  # Shows: On branch github-pages

# Each directory is automatically on its branch!
```

### Making Changes
```bash
# In any deployment directory
git add .
git commit -m "Update booking system"
git push origin <branch-name>

# Changes automatically deploy to respective platform
```

### Creating New Features
```bash
# Start in localhost for development
cd localhost-deploy/
# Make and test changes locally

# Then port to other platforms
cd ../railway-deploy/
# Copy working features
git add . && git commit && git push
```

---

## 🎯 Recommended Workflow

1. **Development:** Use `localhost-deploy/` for building features
2. **Testing:** Deploy to `railway-deploy/` for live testing
3. **Production:** Use `github-pages-deploy/` for final production
4. **Experimentation:** Use `vercel-deploy/` for serverless testing

---

## 🔧 Git Worktree Commands

### View All Worktrees
```bash
git worktree list
```

### Add New Worktree (if needed)
```bash
git worktree add path/to/directory branch-name
```

### Remove Worktree
```bash
git worktree remove path/to/directory
```

---

## 🚨 Important Notes

1. **Branch Independence:** Each branch can have different code
2. **Database Compatibility:** 
   - GitHub Pages: Firebase Firestore
   - Railway/Local/Vercel: File-based JSON
3. **Environment Variables:** Configure per platform
4. **Deployment Time:** 
   - Railway: ~2 minutes
   - GitHub Pages: ~1 minute
   - Vercel: ~30 seconds
   - Local: Instant

---

## 🎯 Quick Decision Guide

**Need live hosting for others to access?** → Railway or GitHub Pages  
**Want cloud database for multiple devices?** → GitHub Pages + Firebase  
**Just testing locally?** → Local Development  
**Want to try serverless?** → Vercel  
**Want the easiest live deployment?** → Railway  
**Want the most professional solution?** → GitHub Pages + Firebase  

---

## 📞 Support

If you need help with any deployment:
- Check the README.md in each deployment directory
- Review the specific platform documentation
- Contact: Mohammed@azab.io

**Happy deploying! 🚀**
