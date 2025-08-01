# � Railway.app Deployment - HagzYomi

**Live hosting for Arabic football court booking system**

## ✨ Features
- 🌍 **Live public hosting** on Railway.app
- 📁 **Persistent file storage** (JSON files with 1GB free space)
- 🔄 **Auto-deployment** from GitHub branch
- 📊 **Server-side report generation** (PDF/Excel/CSV)
- 🔒 **Session-based authentication**
- 💰 **FREE hosting** ($5/month credit covers completely)

## 🚀 Deployment Instructions

### 1. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your **HagzYomi** repository
6. **IMPORTANT:** Select the **`railway`** branch
7. Click **"Deploy"**

### 2. Access Your Live Website
- **Main site**: `https://your-app-name.up.railway.app`
- **Admin panel**: `https://your-app-name.up.railway.app/admin`
- **Password**: `admin123`

### 3. Local Testing (Optional)
```bash
cd railway-deploy/
npm install
npm start
# Access: http://localhost:3000
```

## 📁 Railway Configuration
```
railway-deploy/
├── railway.json            # Railway deployment config
├── package.json            # Dependencies & start command
├── server.js               # Express.js backend optimized for Railway
├── index.html              # Main booking page
├── admin-login.html        # Admin login
├── admin.html              # Admin dashboard
├── script.js               # Frontend functionality
├── admin.js                # Admin frontend
├── styles.css              # All styling
└── data/                   # Persistent data storage (1GB free)
    └── bookings.json       # Bookings database
```

## 🎯 Railway Benefits
✅ **FREE hosting** - $5/month credit covers app completely
✅ **Auto-deployment** - Push to `railway` branch = auto deploy
✅ **Persistent storage** - Data survives deployments
✅ **Custom domains** - Free SSL and custom domain support
✅ **No cold starts** - Always-on hosting
✅ **1GB storage** - Plenty for booking data
✅ **Hot reload** - Changes update instantly

## 🔧 Configuration
Edit `server.js` to change settings:
```javascript
const config = {
    courtName: "ملعب كرة القدم",
    openingHours: { start: "08:00", end: "22:00" },
    maxHoursPerPersonPerDay: 3,
    slotDurationMinutes: 60,
    pricePerHour: 50,
    adminPassword: "admin123"
};
```

## 📊 Data Storage
- **Location**: `data/bookings.json`
- **Format**: JSON array of booking objects
- **Persistence**: Data survives server restarts
- **Backup**: Easy to backup/restore JSON file

## 🛠️ Development Commands
```bash
# Start server
npm start

# Start with auto-reload (if nodemon installed)
npx nodemon server.js

# Install additional packages
npm install package-name
```

## 📱 Perfect For
- Local development and testing
- Learning the codebase
- Adding new features
- Data persistence needed
- Full backend development
- API development and testing

## 🔧 API Endpoints
- `GET /` - Main page
- `GET /admin` - Admin panel
- `POST /admin/login` - Admin login
- `GET /api/config` - Court configuration
- `GET /api/slots/:date` - Available slots
- `POST /api/book` - Create booking
- `GET /api/admin/bookings` - Get all bookings
- `DELETE /api/admin/booking/:id` - Delete booking
- `GET /api/admin/report` - Export reports
