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
├── � railway-deploy/            # Railway.app hosting (FREE)
├── ☁️ vercel-deploy/             # Vercel serverless deployment
├── 📄 DEPLOYMENT_BRANCHES.md     # Detailed deployment guide
└── � README.md                  # This file
```

### 🔗 How Git Worktrees Work
Each deployment directory is a **live link** to its respective branch:
- Changes in directories automatically sync with their branches
- Work on different platforms simultaneously
- No file copying or manual synchronization needed
1. **Enable GitHub Pages**:
   - Go to: Settings → Pages
   - Source: Branch "main", Folder "/github-pages"

2. **Setup Firebase** (5 minutes):
   - Follow: `github-pages/FIREBASE_SETUP.md`
   - Update: `github-pages/firebase-config.js`

3. **Access your site**:
   - `https://mohammed-azab.github.io/HagzYomi/`

**📱 Perfect for: Multiple users, your uncle's phone access, production use**

---

## ⚡ Option 2: Vercel Deployment

**🔧 Good for testing backend features**

### ✨ Why Choose This?
- 🖥️ **Full Node.js backend** - Complete server functionality
- 🚀 **Serverless functions** - Automatic scaling
- 📊 **Server-side processing** - Better for complex operations
- 🔒 **Session management** - Proper authentication

### 🚀 Quick Setup
```bash
cd vercel/
npm install -g vercel
vercel --prod
```

**⚠️ Note**: Uses temporary in-memory storage (data resets)

**🔧 Perfect for: Development, testing, backend learning**

---

## 💻 Option 3: Local Development

**🛠️ Best for development and learning**

### ✨ Why Choose This?
- 📁 **Persistent storage** - Data saved to JSON files
- 🔄 **Hot reload** - Instant updates during development
- 🛠️ **Full control** - Complete customization
- 📊 **Real database** - Persistent JSON file storage

### 🚀 Quick Setup
```bash
cd localhost/
npm install
npm start
# Visit: http://localhost:3000
```

**💻 Perfect for: Learning, development, local testing**

---

## 🎯 Quick Comparison

| Feature | GitHub Pages | Vercel | Localhost |
|---------|-------------|--------|-----------|
| **Cost** | 🆓 Free | 🆓 Free | 💻 Local only |
| **Database** | 🔥 Firebase Cloud | 🧠 Memory (temp) | 📁 JSON files |
| **Multi-device** | ✅ Yes | ❌ No | ❌ No |
| **Your uncle access** | ✅ Yes | ❌ Temporary | ❌ No |
| **Maintenance** | ✅ Zero | ⚠️ Some | 🔧 Full control |
| **Data persistence** | ✅ Permanent | ❌ Temporary | ✅ Permanent |
| **Setup difficulty** | 🟢 Easy | 🟡 Medium | 🟢 Easy |

---

## 🏆 Recommendation

### For Production (You + Your Uncle):
**→ Use GitHub Pages + Firebase** 🌐
- Set up once, works forever
- Your uncle can access from his phone
- All bookings sync across devices
- Professional cloud infrastructure

### For Learning/Development:
**→ Use Localhost** 💻
- Full backend experience
- Easy to modify and test
- Real database with JSON files

### For Testing Backend:
**→ Use Vercel** ⚡
- Test serverless functions
- API development
- Backend debugging

---

## 🚀 Getting Started (Recommended Path)

1. **Start with Localhost** (5 minutes):
   ```bash
   cd localhost/
   npm install && npm start
   ```

2. **Then deploy to GitHub Pages** (10 minutes):
   - Follow `github-pages/README.md`
   - Setup Firebase for shared database

3. **Share with your uncle**:
   - Send him the GitHub Pages URL
   - He can access from his phone!

---

## 📱 Features (All Versions)

✅ **Arabic RTL Interface** - Beautiful Arabic design
✅ **Smart Booking System** - Prevents conflicts
✅ **Admin Dashboard** - Statistics and management
✅ **Export Reports** - PDF, Excel, CSV
✅ **Mobile Responsive** - Works on all devices
✅ **Time Validation** - Prevents past bookings
✅ **Phone Validation** - Saudi number format
✅ **Daily Limits** - Configurable booking limits

---

## 👨‍💻 Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js (localhost/vercel)
- **Database**: Firebase Firestore (GitHub Pages) / JSON files (localhost)
- **PDF Generation**: jsPDF + AutoTable
- **Excel Export**: SheetJS (XLSX)
- **Styling**: Modern CSS with RTL support

---

## 🎯 Admin Access (All Versions)

- **URL**: `/admin-login.html` or `/admin`
- **Password**: `admin123`
- **Features**: View bookings, export reports, delete bookings

---

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Developed By

**GitHub Copilot** - AI-powered development assistant

---

**Choose your preferred deployment method and start booking! ⚽🏟️**

## 👨‍💻 Developer
**Mohammed Azab**
- 📧 Email: [Mohammed@azab.io](mailto:Mohammed@azab.io)
- 🌐 GitHub: [Mohammed-Azab](https://github.com/Mohammed-Azab)

## ✨ Features

### For Users:
- 🌍 **Complete Arabic Interface** with RTL (Right-to-Left) support
- ⚽ **Easy Booking System** for football court slots
- 📱 **Responsive Design** works on all devices
- 🕐 **Real-time Availability** showing booked and available slots
- 🚫 **Past Time Prevention** - cannot book expired time slots
- 💰 **Transparent Pricing** with clear cost display

### For Administrators:
- 📊 **Comprehensive Admin Panel** with booking management
- 📈 **Advanced Reports** (Daily, Weekly, Monthly, Custom Range)
- 📥 **Multi-format Export** (CSV, Excel, PDF)
- 🗑️ **Booking Management** - view and delete bookings
- 📋 **Detailed Statistics** with revenue tracking
- 🔐 **Secure Authentication** with session management

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: JSON Files (no paid database required)
- **Reports**: XLSX, jsPDF, jsPDF-AutoTable
- **Design**: Arabic RTL, Mobile-first Responsive Design

## 📋 Requirements

- Node.js (version 12+ or higher)
- NPM or Yarn

## 🚀 Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Mohammed-Azab/HagzYomi.git
cd HagzYomi
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the application:**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. **Access the system:**
- Main website: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- Default admin password: `admin123`

## ⚙️ Configuration

Customize the system through `config.json`:

```json
{
  "courtName": "ملعب حجز يومي",
  "openingHours": {
    "start": "10:00",
    "end": "22:00"
  },
  "workingDays": ["sunday", "monday", "tuesday", "wednesday", "thursday"],
  "maxHoursPerPersonPerDay": 3,
  "adminPassword": "admin123",
  "slotDurationMinutes": 60,
  "currency": "جنيه",
  "pricePerHour": 100
}
```

### Configuration Options:

- **courtName**: Court/facility name
- **openingHours**: Operating hours (start and end)
- **workingDays**: Working days of the week
- **maxHoursPerPersonPerDay**: Maximum hours per person per day
- **adminPassword**: Admin panel password
- **slotDurationMinutes**: Duration of each booking slot
- **currency**: Currency symbol/name
- **pricePerHour**: Price per hour

## 📁 Project Structure

```
HagzYomi/
├── public/              # Static files
│   ├── index.html       # Main booking page
│   ├── admin.html       # Admin dashboard
│   ├── admin-login.html # Admin login page
│   ├── styles.css       # CSS styles
│   ├── script.js        # Main page JavaScript
│   └── admin.js         # Admin panel JavaScript
├── data/                # Data directory (auto-created)
│   └── bookings.json    # Bookings database
├── server.js            # Main server file
├── config.json          # Configuration file
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## 📡 API Endpoints

### Public Endpoints:
- `GET /api/config` - Get system configuration
- `GET /api/slots/:date` - Get available slots for a date
- `POST /api/book` - Create a new booking

### Admin Endpoints:
- `POST /admin/login` - Admin authentication
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/report` - Download reports (CSV/Excel/PDF)
- `DELETE /api/admin/booking/:id` - Delete a booking

## 🎨 Customization

### Change Colors:
Edit CSS variables in `public/styles.css`:

```css
:root {
    --primary-color: #2196F3;    /* Primary color */
    --secondary-color: #4CAF50;  /* Secondary color */
    --accent-color: #FF9800;     /* Accent color */
}
```

### Add New Features:
- Modify `server.js` to add new API endpoints
- Add required JavaScript in appropriate files
- Update HTML files as needed

## 🔒 Security Features

- Server-side password validation
- Secure admin sessions with timeout
- Input data validation and sanitization
- CSRF protection and common attack prevention
- Past time booking prevention

## 🌐 Deployment

### Local Development:
```bash
npm start
```

### Production Server:
1. Upload files to server
2. Install Node.js
3. Run `npm install`
4. Run `npm start`
5. Use PM2 for continuous operation (optional)

### Using PM2:
```bash
npm install -g pm2
pm2 start server.js --name "hagz-yomi"
pm2 startup
pm2 save
```

## 🔧 Maintenance

- Regularly backup the `data` folder
- Monitor server logs for errors
- Update admin password regularly
- Check `data/bookings.json` periodically

## 📄 License

This project is licensed under the MIT License for personal and educational use.

## 💬 Support & Contact

- 📧 **Email**: [Mohammed@azab.io](mailto:Mohammed@azab.io)
- 🐛 **Bug Reports**: Create a new GitHub Issue
- 💡 **Feature Requests**: Contact directly via email
- 🤝 **Technical Support**: Available via email

---

## 📖 النسخة العربية

# حجز يومي - نظام حجز ملعب كرة القدم

نظام حجز إلكتروني باللغة العربية لحجز مواعيد ملعب كرة القدم مع لوحة إدارة متطورة.

## 👨‍💻 المطور
**Mohammed Azab**
- 📧 البريد الإلكتروني: [Mohammed@azab.io](mailto:Mohammed@azab.io)
- 🌐 GitHub: [Mohammed-Azab](https://github.com/Mohammed-Azab)

## ✨ الميزات

### للمستخدمين:
- 🌍 **واجهة عربية كاملة** مع دعم الكتابة من اليمين إلى اليسار
- ⚽ **حجز المواعيد** بسهولة ويسر
- 📱 **تصميم متجاوب** يعمل على جميع الأجهزة
- 🕐 **عرض الحالة المباشرة** للمواعيد المتاحة والمحجوزة
- � **منع الحجز المتأخر** - لا يمكن حجز مواعيد منتهية
- 💰 **عرض الأسعار بوضوح** مع تفاصيل التكلفة

### للإدارة:
- 📊 **لوحة إدارة شاملة** لمتابعة الحجوزات
- 📈 **تقارير متقدمة** (يومية، أسبوعية، شهرية، مخصصة)
- 📥 **تصدير متعدد الصيغ** (CSV, Excel, PDF)
- 🗑️ **إدارة الحجوزات** - عرض وحذف الحجوزات
- 📋 **إحصائيات مفصلة** مع تتبع الإيرادات
- 🔐 **مصادقة آمنة** مع إدارة الجلسات

## 🛠️ التقنيات المستخدمة

- **الخادم**: Node.js, Express.js
- **الواجهة**: HTML5, CSS3, JavaScript العادي
- **قاعدة البيانات**: ملفات JSON (لا تحتاج قاعدة بيانات مدفوعة)
- **التقارير**: XLSX, jsPDF, jsPDF-AutoTable
- **التصميم**: عربي RTL، تصميم متجاوب

## 📋 المتطلبات

- Node.js (النسخة 12 أو أحدث)
- NPM أو Yarn

## 🚀 التثبيت والتشغيل

1. **نسخ المشروع:**
```bash
git clone https://github.com/Mohammed-Azab/HagzYomi.git
cd HagzYomi
```

2. **تثبيت التبعيات:**
```bash
npm install
```

3. **تشغيل التطبيق:**
```bash
npm start
```

أو للتطوير مع إعادة التشغيل التلقائي:
```bash
npm run dev
```

4. **الوصول للنظام:**
- الموقع الرئيسي: http://localhost:3000
- لوحة الإدارة: http://localhost:3000/admin
- كلمة مرور الإدارة الافتراضية: `admin123`

## ⚙️ الإعدادات

يمكن تخصيص النظام من خلال ملف `config.json`:

```json
{
  "courtName": "ملعب حجز يومي",
  "openingHours": {
    "start": "10:00",
    "end": "22:00"
  },
  "workingDays": ["sunday", "monday", "tuesday", "wednesday", "thursday"],
  "maxHoursPerPersonPerDay": 3,
  "adminPassword": "admin123",
  "slotDurationMinutes": 60,
  "currency": "جنيه",
  "pricePerHour": 100
}
```

### شرح الإعدادات:

- **courtName**: اسم الملعب/المنشأة
- **openingHours**: ساعات العمل (بداية ونهاية)
- **workingDays**: أيام العمل في الأسبوع
- **maxHoursPerPersonPerDay**: الحد الأقصى للساعات لكل شخص يومياً
- **adminPassword**: كلمة مرور لوحة الإدارة
- **slotDurationMinutes**: مدة كل فترة حجز بالدقائق
- **currency**: رمز/اسم العملة
- **pricePerHour**: السعر لكل ساعة

## � هيكل المشروع

```
HagzYomi/
├── public/              # الملفات الثابتة
│   ├── index.html       # صفحة الحجز الرئيسية
│   ├── admin.html       # لوحة الإدارة
│   ├── admin-login.html # صفحة تسجيل دخول الإدارة
│   ├── styles.css       # ملف التنسيقات
│   ├── script.js        # JavaScript الصفحة الرئيسية
│   └── admin.js         # JavaScript لوحة الإدارة
├── data/                # مجلد البيانات (ينشأ تلقائياً)
│   └── bookings.json    # قاعدة بيانات الحجوزات
├── server.js            # ملف الخادم الرئيسي
├── config.json          # ملف الإعدادات
├── package.json         # تبعيات Node.js
└── README.md           # هذا الملف
```

## 📡 نقاط API المتاحة

### النقاط العامة:
- `GET /api/config` - جلب إعدادات النظام
- `GET /api/slots/:date` - جلب المواعيد المتاحة لتاريخ معين
- `POST /api/book` - إنشاء حجز جديد

### نقاط الإدارة:
- `POST /admin/login` - مصادقة الإدارة
- `GET /api/admin/bookings` - جلب جميع الحجوزات
- `GET /api/admin/report` - تحميل التقارير (CSV/Excel/PDF)
- `DELETE /api/admin/booking/:id` - حذف حجز

## 🎨 التخصيص

### تغيير الألوان:
عدّل متغيرات CSS في `public/styles.css`:

```css
:root {
    --primary-color: #2196F3;    /* اللون الأساسي */
    --secondary-color: #4CAF50;  /* اللون الثانوي */
    --accent-color: #FF9800;     /* اللون المكمل */
}
```

### إضافة ميزات جديدة:
- عدّل `server.js` لإضافة نقاط API جديدة
- أضف JavaScript المطلوب في الملفات المناسبة
- حدّث ملفات HTML حسب الحاجة

## 🔒 ميزات الأمان

- التحقق من كلمة المرور على جانب الخادم
- جلسات إدارة آمنة مع انتهاء الصلاحية
- التحقق من صحة البيانات المدخلة وتنظيفها
- حماية من CSRF والهجمات الشائعة
- منع حجز المواعيد المنتهية

## 🌐 النشر

### التطوير المحلي:
```bash
npm start
```

### خادم الإنتاج:
1. رفع الملفات للخادم
2. تثبيت Node.js
3. تشغيل `npm install`
4. تشغيل `npm start`
5. استخدام PM2 للتشغيل المستمر (اختياري)

### استخدام PM2:
```bash
npm install -g pm2
pm2 start server.js --name "hagz-yomi"
pm2 startup
pm2 save
```

## 🔧 الصيانة

- عمل نسخ احتياطية دورية لمجلد `data`
- مراقبة سجلات الخادم للأخطاء
- تحديث كلمة مرور الإدارة بانتظام
- فحص `data/bookings.json` بشكل دوري

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT للاستخدام الشخصي والتعليمي.

## 💬 الدعم والتواصل

- 📧 **البريد الإلكتروني**: [Mohammed@azab.io](mailto:Mohammed@azab.io)
- 🐛 **الإبلاغ عن الأخطاء**: إنشاء Issue جديد في GitHub
- 💡 **طلبات الميزات**: التواصل المباشر عبر البريد الإلكتروني
- 🤝 **الدعم التقني**: متاح عبر البريد الإلكتروني

---

## 📝 Copyright & License

© 2025 **Mohammed Azab**. All rights reserved.

This project is protected by copyright. Developed by Mohammed Azab.

**تم التطوير بواسطة Mohammed Azab مع ❤️ للمجتمع العربي**

💻 جميع الحقوق محفوظة لـ Mohammed Azab - [Mohammed@azab.io](mailto:Mohammed@azab.io)