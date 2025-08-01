# 💻 Localhost Version - HagzYomi

**Local development with Node.js backend**

## ✨ Features
- 🖥️ **Full Node.js backend** with Express.js
- 📁 **Persistent file storage** (JSON files)
- 🔄 **Hot reload** during development
- 📊 **Server-side report generation** (PDF/Excel/CSV)
- 🔒 **Session-based authentication**

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd localhost/
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Access Your Website
- **Main site**: `http://localhost:3000`
- **Admin panel**: `http://localhost:3000/admin`
- **Password**: `admin123`

## 📁 Files Structure
```
localhost/
├── index.html              # Main booking page
├── admin-login.html        # Admin login
├── admin.html              # Admin dashboard
├── script.js               # Frontend functionality
├── admin.js                # Admin frontend
├── styles.css              # All styling
├── server.js               # Backend API
├── package.json            # Dependencies
└── data/                   # Data storage folder
    └── bookings.json       # Bookings database
```

## 🎯 Benefits
✅ **Persistent storage** - Data saved to files
✅ **Full backend** - Complete server functionality
✅ **Development friendly** - Easy debugging
✅ **Real database** - JSON file storage
✅ **Sessions** - Proper authentication
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
