# 🎯 Render Deployment - HagzYomi

## 🚀 Deploy to Render (FREE)

This branch is optimized for **Render.com** deployment - a reliable alternative to Railway.

### ✅ Ready-to-Deploy Features:
- **Free Tier:** 750 hours/month (always-on with activity)
- **Auto-Deploy:** Connects to GitHub for automatic deployments
- **Node.js 18:** Modern runtime with full compatibility
- **Persistent Storage:** Built-in file storage for bookings
- **Custom Domain:** Free subdomain included

### 🔧 Deployment Steps:

1. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect this repository
   - Select the `render` branch

2. **Configuration:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 18 (auto-detected via .nvmrc)

3. **Environment Variables:**
   - Set `ADMIN_PASSWORD` in Render dashboard for security
   - See `SECURITY_SETUP.md` for detailed instructions
   - GitHub secrets integration available

### 🔐 Security Setup (IMPORTANT):
1. **Create GitHub Secret:**
   - Go to repository Settings → Secrets → Actions
   - Add secret: `ADMIN_PASSWORD` with your secure password
2. **Configure Render:**
   - In Render dashboard → Environment
   - Add: `ADMIN_PASSWORD` = your secure password
3. **See:** `SECURITY_SETUP.md` for complete guide

### 🌟 Why Render > Railway:
- ✅ More stable deployment process
- ✅ Better free tier (750 hours vs Railway's limitations)
- ✅ Faster cold starts
- ✅ Built-in health checks
- ✅ Better logging and monitoring

### 📊 Features Included:
- Arabic RTL football court booking system
- Admin panel with real-time management
- PDF/Excel export functionality
- Session-based authentication
- File-based JSON storage (Render persistent)

### 🔗 After Deployment:
Your app will be available at: `https://your-app-name.onrender.com`

Admin panel: `https://your-app-name.onrender.com/admin`
Admin password: Use your secure `ADMIN_PASSWORD` environment variable
(Fallback: `admin123` if env var not set)

---
**© 2025 Mohammed Azab. All rights reserved.**
