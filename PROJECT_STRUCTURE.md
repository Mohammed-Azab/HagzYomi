# 🏗️ HagzYomi - Project Structure

A well-organized Node.js football court booking system with Supabase cloud database.

## 📁 Directory Structure

```
HagzYomi/
├── 📄 server.js                 # Main application server (Entry point)
├── 📄 index.html                # Main landing page
├── 📄 package.json              # Node.js dependencies
├── 📄 render.yaml               # Render deployment configuration
├── 📄 README.md                 # Project documentation
├── 📄 LICENSE                   # MIT License
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore                # Git ignore rules
│
├── 📂 public/                   # Static web assets
│   ├── 📂 css/                  # Stylesheets
│   │   └── 📄 styles.css        # Main application styles
│   ├── 📂 js/                   # Client-side JavaScript
│   │   ├── 📄 script.js         # Main booking functionality
│   │   ├── 📄 admin.js          # Admin panel functionality
│   │   └── 📄 check-booking.js  # Booking verification
│   └── 📂 html/                 # HTML pages
│       ├── 📄 admin.html        # Admin dashboard
│       ├── 📄 admin-login.html  # Admin authentication
│       └── 📄 check-booking.html # Booking lookup page
│
├── 📂 src/                      # Source code
│   ├── 📂 config/               # Configuration files
│   │   └── 📄 config.json       # Application configuration
│   ├── 📂 database/             # Database layer
│   │   ├── 📄 supabase-database.js # Supabase integration
│   │   └── 📄 database.js       # Legacy database (backup)
│   ├── 📂 routes/               # API routes (future expansion)
│   ├── 📂 middleware/           # Express middleware (future)
│   └── 📂 utils/                # Utility scripts
│       ├── 📄 db-tool.js        # Database management tool
│       ├── 📄 setup-supabase.js # Database setup script
│       └── 📄 debug-bookings.js # Debugging utilities
│
├── 📂 tests/                    # Test files
│   ├── 📂 manual/               # Manual testing pages
│   │   ├── 📄 test-booking.html
│   │   └── 📄 test-admin.html
│   ├── 📄 test-booking-api.js   # API tests
│   ├── 📄 test-database.js      # Database tests
│   └── 📄 test-env.js           # Environment tests
│
├── 📂 docs/                     # Documentation
│   ├── 📄 DATABASE.md           # Database documentation
│   ├── 📄 CONFIG_GUIDE.md       # Configuration guide
│   ├── 📄 SUPABASE_SETUP.md     # Supabase setup guide
│   └── 📄 *.md                  # Other documentation
│
├── 📂 backup/                   # Legacy and backup files
│   ├── 📄 server_new.js         # Previous server versions
│   ├── 📄 bookings.json         # Legacy booking data
│   └── 📄 *.js                  # Other backup scripts
│
└── 📂 data/                     # Data files (if any)
    └── 📄 *.json                # Data exports/imports
```

## 🚀 Key Features of This Structure

### ✅ **Separation of Concerns**
- **`public/`** - All client-side assets (CSS, JS, HTML)
- **`src/`** - Server-side source code and configuration
- **`tests/`** - Testing files separated from production code
- **`docs/`** - Documentation in dedicated folder

### ✅ **Logical Organization**
- **Static assets** grouped by type (css/, js/, html/)
- **Database layer** isolated in src/database/
- **Configuration** centralized in src/config/
- **Utilities** separated from core logic

### ✅ **Development Benefits**
- Easy to find and maintain files
- Clear separation between frontend and backend
- Test files don't clutter main directories
- Documentation is organized and accessible

### ✅ **Deployment Ready**
- Clean structure for production deployment
- Easy to exclude development files
- Clear entry points (server.js, package.json)
- Environment configuration separated

## 🔧 File Purposes

| File/Directory | Purpose |
|---|---|
| `server.js` | Main Express.js application server |
| `public/css/styles.css` | All application styling |
| `public/js/script.js` | Main booking form functionality |
| `public/js/admin.js` | Admin panel management |
| `src/database/supabase-database.js` | Database operations |
| `src/config/config.json` | Application settings |
| `tests/` | Testing and debugging files |
| `docs/` | Project documentation |

## 🌐 URL Routes

| Route | File Served | Purpose |
|---|---|---|
| `/` | `index.html` | Main booking page |
| `/admin` | `public/html/admin.html` | Admin dashboard |
| `/admin-login` | `public/html/admin-login.html` | Admin authentication |
| `/check-booking` | `public/html/check-booking.html` | Booking verification |

## 🛠️ Development Workflow

1. **Frontend changes**: Edit files in `public/`
2. **Backend changes**: Edit `server.js` or files in `src/`
3. **Configuration**: Modify `src/config/config.json`
4. **Testing**: Use files in `tests/`
5. **Documentation**: Update files in `docs/`

This structure provides a solid foundation for maintaining and scaling the HagzYomi booking system.
