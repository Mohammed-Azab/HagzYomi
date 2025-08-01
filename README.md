# 🏟️ HagzYomi - Football Court Booking System

**Complete Arabic RTL football court booking system with admin panel**

> **Developer:** Mohammed Azab | **Email:** Mohammed@azab.io | **© 2025 All Rights Reserved**

---

## 🎯 About This Project

HagzYomi is a comprehensive Arabic football court booking system featuring:
- ✅ **Arabic RTL interface** - Fully localized for Arabic users
- ✅ **Real-time booking system** - Time slot management and validation
- ✅ **Admin dashboard** - Complete booking management with analytics
- ✅ **Multi-format exports** - PDF, Excel, and CSV reports
- ✅ **Egyptian currency** - Prices displayed in جنيه
- ✅ **Mobile responsive** - Works perfectly on all devices
- ✅ **Multi-platform deployment** - Choose your preferred hosting

---

## 🌟 Repository Structure

This repository uses **Git Worktrees** to organize different deployment methods:

```
HagzYomi/                          # 📋 Main documentation & project info
├── 🌐 github-pages-deploy/       # GitHub Pages + Firebase (RECOMMENDED)
├── 💻 localhost-deploy/          # Local development environment  
├── 🚂 railway-deploy/            # Railway.app hosting (FREE)
├── ☁️ vercel-deploy/             # Vercel serverless deployment
├── 📄 DEPLOYMENT_BRANCHES.md     # Detailed deployment guide
└── 📄 README.md                  # This file
```

### 🔗 How Git Worktrees Work
Each deployment directory is a **live link** to its respective branch:
- Changes in directories automatically sync with their branches
- Work on different platforms simultaneously
- No file copying or manual synchronization needed

---

## 🚀 Quick Start - Choose Your Platform

### 🌐 **GitHub Pages + Firebase (RECOMMENDED)**
**Best for:** Production use, multi-device access, your uncle's phone access
```bash
cd github-pages-deploy/
# Follow setup in docs/FIREBASE_SETUP.md
# Deploy: Enable GitHub Pages from /docs folder
```
**✅ FREE | ✅ Cloud Database | ✅ Multi-device | ✅ Zero maintenance**

### 🚂 **Railway.app (EASIEST)**
**Best for:** Quick live hosting with minimal setup
```bash
cd railway-deploy/
# Deploy: Connect to railway.app and select 'railway' branch
```
**✅ FREE ($5/month credit) | ✅ 5-minute setup | ✅ Auto-deployment**

### 💻 **Local Development**
**Best for:** Development and testing
```bash
cd localhost-deploy/
npm install && npm start
# Access: http://localhost:3000
```
**✅ File-based database | ✅ Full Node.js environment | ✅ Hot reloading**

### ☁️ **Vercel Serverless**
**Best for:** Serverless architecture testing
```bash
cd vercel-deploy/
# Deploy: Connect to vercel.com
```
**✅ FREE | ✅ Serverless | ✅ Global edge functions**

---

## 📋 Features Available in All Versions

- 🏟️ **Football court booking system**
- 📅 **Date and time slot management**
- 👤 **User booking with validation**
- 🔐 **Admin authentication** (password: admin123)
- 📊 **Booking management** (view, delete, analytics)
- 📄 **Export reports** (PDF, Excel, CSV formats)
- 📱 **Mobile-responsive design**
- 🕐 **Real-time availability checking**
- 💰 **Egyptian currency support** (جنيه)
- 🌍 **Arabic RTL interface**

---

## 📚 Documentation

- **[DEPLOYMENT_BRANCHES.md](DEPLOYMENT_BRANCHES.md)** - Detailed deployment guide for all platforms
- **[GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)** - Firebase configuration guide
- **Platform-specific READMEs** - Available in each deployment directory

---

## 🎮 Admin Panel

Access the admin dashboard at `/admin` on any deployment:
- **Username:** admin
- **Password:** admin123
- **Features:** View bookings, delete reservations, export reports, analytics

---

## 🔧 Development Workflow

### Working with Multiple Deployments
```bash
# Local development
cd localhost-deploy/
git checkout localhost
# Make changes, test locally

# Railway production  
cd railway-deploy/
git checkout railway
# Make production changes

# Each branch stays independent!
```

### Branch Overview
- **`main`** - Documentation and project overview
- **`localhost`** - Local development environment
- **`railway`** - Railway.app deployment
- **`github-pages`** - GitHub Pages + Firebase
- **`vercel`** - Vercel serverless deployment

---

## 🌟 Why Choose HagzYomi?

✅ **Complete Solution** - Everything you need for court booking  
✅ **Arabic-First** - Built specifically for Arabic users  
✅ **Multiple Deployment Options** - Choose what works for you  
✅ **Production Ready** - Used in real football court businesses  
✅ **Free Hosting Options** - No hosting costs required  
✅ **Open Source** - MIT License, use freely  

---

## 📞 Contact & Support

**Developer:** Mohammed Azab  
**Email:** Mohammed@azab.io  
**License:** MIT License  
**Copyright:** © 2025 Mohammed Azab. All rights reserved.  

---

## 🎯 Quick Links

- 🚀 [Deploy to Railway](railway-deploy/) - Fastest live hosting
- 🌐 [Deploy to GitHub Pages](github-pages-deploy/) - Best for production  
- 💻 [Local Development](localhost-deploy/) - Development environment
- 📋 [Deployment Guide](DEPLOYMENT_BRANCHES.md) - Detailed instructions

**Ready to book some football time? Choose your deployment method above! ⚽**