# ⚡ Quick Fix for Render.com Deployment

## 🚨 Error on Render:
```
❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required
```

## ✅ Solution (3 Steps):

### 1. Set Environment Variables in Render Dashboard

**Go to your Render service** → **Environment tab** → **Add these:**

| Variable Name | Value |
|---------------|--------|
| `SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-anon-key-here` |

### 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) (FREE account)
2. Create new project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon/public key** → Use as `SUPABASE_ANON_KEY`

### 3. Create Database Table

In Supabase **SQL Editor**, run:

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

## 🔄 Then Deploy

In Render: **Manual Deploy** → **Wait for completion**

---

## ✅ Your app will now start successfully! 🚀

**Need help?** Contact: Mohammed@azab.io
