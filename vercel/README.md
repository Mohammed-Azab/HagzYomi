# ⚡ Vercel Version - HagzYomi

**Node.js backend with serverless functions**

## ✨ Features
- 🖥️ **Full Node.js backend** with Express.js
- 📁 **File-based storage** (JSON files)
- 🚀 **Serverless deployment** on Vercel
- 📊 **Server-side report generation** (PDF/Excel/CSV)
- 🔒 **Session-based authentication**

## 🚀 Deployment Instructions

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
cd vercel/
vercel --prod
```

### 3. Access Your Website
Vercel will provide you with a URL like:
- **Main site**: `https://your-project.vercel.app`
- **Admin panel**: `https://your-project.vercel.app/admin`
- **Password**: `admin123`

## 📁 Files Structure
```
vercel/
├── index.html              # Main booking page
├── admin-login.html        # Admin login
├── admin.html              # Admin dashboard
├── script.js               # Frontend functionality
├── admin.js                # Admin frontend
├── styles.css              # All styling
├── server.js               # Backend API
├── package.json            # Dependencies
└── vercel.json             # Vercel config
```

## 🎯 Benefits
✅ **Full backend** - Server-side processing
✅ **Sessions** - Proper admin authentication
✅ **File storage** - JSON files for data
✅ **Server-side exports** - Better PDF/Excel generation
✅ **API endpoints** - RESTful API structure

## 🔧 Configuration
Edit `server.js` to change settings:
```javascript
const config = {
    courtName: "ملعب كرة القدم",
    openingHours: { start: "08:00", end: "22:00" },
    pricePerHour: 50,
    adminPassword: "admin123"
};
```

## ⚠️ Important Notes
- **Data storage**: Uses in-memory storage on Vercel (temporary)
- **Sessions**: Reset on function restart
- **Best for**: Testing and development
- **Consider**: GitHub Pages version for production

## 📱 Perfect For
- Testing full backend functionality
- Development and debugging
- Server-side report generation
- API testing
