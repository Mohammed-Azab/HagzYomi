# HagzYomi - Football Court Booking System (GitHub Pages Version)

🏟️ **نظام حجز ملعب كرة القدم** - A complete Arabic football court booking system hosted on GitHub Pages.

## 🌟 Features

- **Arabic RTL Interface** - Clean and modern Arabic interface
- **Real-time Booking** - Instant slot availability checking
- **Smart Validation** - Phone number, date, and time validation
- **Admin Dashboard** - Complete management panel with statistics
- **Multi-format Reports** - Export bookings as PDF, Excel, or CSV
- **Date Range Filtering** - Filter reports by date ranges
- **Client-side Storage** - Uses localStorage (no backend required)
- **Responsive Design** - Works perfectly on all devices

## 🚀 Live Demo

Visit: **[Your GitHub Pages URL]**

## 👤 Admin Access

- URL: `/admin-login.html`
- Password: `admin123`

## 📁 Project Structure

```
docs/
├── index.html          # Main booking page
├── admin-login.html    # Admin login page
├── admin.html          # Admin dashboard
├── styles.css          # All styling
├── script.js           # Main booking functionality
├── admin-login.js      # Login handling
└── admin.js            # Admin panel functionality
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage (client-side)
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Excel Export**: SheetJS (xlsx)
- **Hosting**: GitHub Pages

## ⚙️ Configuration

The system comes pre-configured with these settings:

```javascript
const CONFIG = {
    courtName: "ملعب كرة القدم",
    openingHours: { start: "08:00", end: "22:00" },
    maxHoursPerPersonPerDay: 3,
    slotDurationMinutes: 60,
    pricePerHour: 50,
    currency: "ريال"
};
```

## 📱 How to Use

### For Customers:
1. Visit the main page
2. Fill in your name and phone number
3. Select your preferred date and time
4. Click "احجز الآن" (Book Now)
5. Receive booking confirmation

### For Admins:
1. Go to `/admin-login.html`
2. Enter password: `admin123`
3. View booking statistics
4. Export reports in PDF/Excel/CSV format
5. Manage existing bookings

## 🎯 Key Features

### Booking System
- **Smart Time Slots**: Automatically generates available time slots
- **Conflict Prevention**: Prevents double booking
- **Daily Limits**: Enforces maximum hours per person per day
- **Phone Validation**: Saudi phone number format validation

### Admin Dashboard
- **Real-time Statistics**: Today's and total bookings/revenue
- **Advanced Filtering**: Filter bookings by date
- **Export Options**: PDF, Excel, and CSV reports
- **Date Range Reports**: Generate reports for specific periods

### Data Storage
- **Client-side Storage**: All data stored in browser localStorage
- **Persistent Data**: Bookings persist across browser sessions
- **No Backend Required**: Perfect for GitHub Pages hosting

## 🔧 Customization

To modify the court settings, edit the `CONFIG` object in `script.js`:

```javascript
// Change working hours
openingHours: { start: "09:00", end: "23:00" }

// Change pricing
pricePerHour: 75

// Change daily limit
maxHoursPerPersonPerDay: 4

// Change admin password (also update in admin-login.js)
adminPassword: "your-new-password"
```

## 📊 Report Features

The admin panel can generate comprehensive reports including:

- **PDF Reports**: Professional formatted reports with Arabic support
- **Excel Spreadsheets**: Detailed data for further analysis  
- **CSV Files**: Raw data for external processing
- **Date Filtering**: Generate reports for specific time periods
- **Statistics**: Total bookings, revenue, daily summaries

## 🌐 Browser Compatibility

- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 📝 Note

This is a **client-side only** version that uses localStorage for data persistence. Data is stored locally in each user's browser. For a production environment with shared data across multiple devices, consider using the server-based version.

## 👨‍💻 Development

Developed by [GitHub Copilot](https://github.com/github-copilot)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**HagzYomi** - Making football court booking simple and efficient! ⚽
