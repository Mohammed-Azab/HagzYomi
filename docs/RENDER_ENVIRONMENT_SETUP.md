# 🚀 Render.com Deployment Guide for Supabase

## ❌ Problem: Environment Variables Not Found

Render shows this error because **environment variables must be set in Render's dashboard**, not in your local `.env` file.

---

## ✅ Solution: Configure Environment Variables in Render

### Step 1: Set Environment Variables in Render Dashboard

1. **Go to your Render service dashboard**
2. **Click "Environment" tab**
3. **Add these environment variables:**

```
Variable Name: SUPABASE_URL
Value: https://your-project-id.supabase.co

Variable Name: SUPABASE_ANON_KEY  
Value: your-anon-key-here
```

### Step 2: Get Your Supabase Credentials

If you haven't created a Supabase project yet:

1. **Go to [supabase.com](https://supabase.com)**
2. **Create a new project (FREE)**
3. **Go to Settings → API**
4. **Copy these values:**
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon/public key** → Use as `SUPABASE_ANON_KEY`

### Step 3: Create Database Table

After setting environment variables, create the table in Supabase:

1. **Go to Supabase SQL Editor**
2. **Run this SQL:**

```sql
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
    price REAL DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    expiresAt TIMESTAMP,
    confirmedAt TIMESTAMP,
    declinedAt TIMESTAMP,
    isRecurring BOOLEAN DEFAULT false,
    recurringWeeks INTEGER DEFAULT 1,
    bookingDates TEXT,
    paymentInfo TEXT
);
```

### Step 4: Redeploy

After setting environment variables in Render:
1. **Go to your service**
2. **Click "Manual Deploy"**
3. **Wait for deployment to complete**

---

## 🔧 Alternative: Add Fallback for Development

If you want to run locally with a `.env` file, I can add support for that:

Create `.env` file:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📋 Render Environment Variables Checklist

Make sure these are set in **Render Dashboard → Environment**:

- [ ] `SUPABASE_URL` = `https://your-project-id.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `your-anon-key-here`
- [ ] Optional: `ADMIN_PASSWORD` = `your-admin-password`
- [ ] Optional: `SUPER_ADMIN_PASSWORD` = `your-super-admin-password`

---

## 🎯 Quick Fix Steps

1. **Add environment variables in Render dashboard**
2. **Click "Manual Deploy" in Render**
3. **Check deployment logs for success**

Your app should start successfully once the environment variables are properly set in Render!

---

## 🆘 Still Having Issues?

Check these common problems:

1. **Typos in variable names** - Must be exactly `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. **Missing quotes** - Values should NOT have quotes in Render dashboard
3. **Wrong URL format** - Should be `https://your-id.supabase.co` (not just the ID)
4. **Wrong key** - Use the `anon` key, not the `service_role` key

**Contact:** Mohammed@azab.io for support
