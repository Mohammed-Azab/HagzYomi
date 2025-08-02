# Supabase Setup Guide for HagzYomi

## 🎯 Why Supabase?

- **100% FREE tier** with 500MB database, 2GB bandwidth/month
- **PostgreSQL** database (more powerful than SQLite)
- **Real-time subscriptions** for live updates
- **Built-in authentication** (if needed later)
- **Dashboard** for easy data management
- **No server maintenance** required

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" (free signup)
3. Create a new project:
   - **Name**: `HagzYomi`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users

### Step 2: Get Your Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

### Step 3: Configure HagzYomi
1. Set environment variables:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   ```

   Or for Render.com deployment, add these in Environment Variables:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key`

### Step 4: Create Database Table
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL and click **Run**:

```sql
-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    groupId TEXT,
    bookingNumber TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    totalSlots INTEGER,
    slotIndex INTEGER,
    startTime TEXT,
    endTime TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    price DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    expiresAt TIMESTAMP,
    isRecurring BOOLEAN DEFAULT FALSE,
    recurringWeeks INTEGER DEFAULT 1,
    bookingDates JSONB,
    paymentInfo JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(bookingNumber);

-- Enable Row Level Security (optional, for enhanced security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on bookings" ON bookings
    FOR ALL USING (true)
    WITH CHECK (true);
```

### Step 5: Test Connection
1. Restart your HagzYomi server
2. Look for: `✅ Connected to Supabase cloud database`
3. Make a test booking to verify everything works

## 🔄 Migration from SQLite

If you already have bookings in SQLite:

1. **Export SQLite data**:
   ```bash
   node -e "
   const Database = require('./database');
   const db = new Database();
   db.getAllBookings().then(bookings => {
     console.log(JSON.stringify(bookings, null, 2));
   });
   "
   ```

2. **Import to Supabase**:
   - Copy the JSON output
   - In Supabase dashboard, go to **Table Editor** → **bookings**
   - Click **Insert** → **Import from JSON**
   - Paste your data

## 🎛️ Dashboard Features

Your Supabase dashboard provides:
- **Table Editor**: View/edit bookings directly
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated API documentation
- **Logs**: Monitor database activity
- **Metrics**: Usage statistics

## 🔒 Security Notes

- The **anon key** is safe to use in client-side code
- For production, consider setting up proper **Row Level Security**
- Never expose your **service_role** key publicly

## 💰 Free Tier Limits

- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **Requests**: 50,000/month
- **Realtime**: 2 concurrent connections

Perfect for most small to medium booking systems!

## 🆘 Troubleshooting

1. **"Supabase not configured"**: Check environment variables
2. **"Table doesn't exist"**: Run the SQL setup commands
3. **Connection errors**: Verify URL and key are correct
4. **Permission denied**: Check RLS policies

## 📞 Support

- [Supabase Documentation](https://supabase.com/docs)
- [Community Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
