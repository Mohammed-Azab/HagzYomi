# Payment Columns Database Migration

## Overview
This document provides instructions for adding payment tracking columns to the Supabase database to support the partial payment system.

## Required Database Changes

### 1. Add Payment Tracking Columns

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Add payment tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN DEFAULT false;
```

### 2. Update Existing Bookings

Initialize payment values for existing bookings:

```sql
-- Update existing bookings with initial payment values
UPDATE bookings 
SET 
    paid_amount = 0,
    remaining_amount = price,
    payment_history = '[]'::jsonb,
    fully_paid = false
WHERE paid_amount IS NULL;
```

## Column Descriptions

### `paid_amount` (DECIMAL(10,2))
- Stores the total amount paid by the customer
- Default: 0
- Updated when payments are recorded

### `remaining_amount` (DECIMAL(10,2))
- Stores the remaining amount to be paid
- Calculated as: `total_price - paid_amount`
- Updated automatically when payments are recorded

### `payment_history` (JSONB)
- Stores an array of payment records
- Each record contains: amount, date, note
- Default: empty array `[]`

### `fully_paid` (BOOLEAN)
- Indicates if the booking is fully paid
- Default: false
- Set to true when `paid_amount >= total_price`

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Create a new query
4. Copy and paste the SQL commands above
5. Run the queries

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset --db-url "your-database-url"
```

### Option 3: Programmatic Migration

Run the migration script (note: requires enabling SQL functions):
```bash
node add-payment-columns.js
```

## Verification

After applying the migration, verify the changes:

```sql
-- Check if columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('paid_amount', 'remaining_amount', 'payment_history', 'fully_paid');

-- Check existing data
SELECT id, bookingnumber, price, paid_amount, remaining_amount, fully_paid 
FROM bookings 
LIMIT 5;
```

## Migration Status

- ✅ Database schema updated (Supabase-database.js)
- ✅ Server-side API updated (server.js)
- ✅ Admin interface updated (admin.html, admin.js)
- ✅ Check-booking interface updated (check-booking.js)
- ⏳ **Database columns need to be added manually**

## Impact

After migration:
- Admin panel will show separate "مدفوع" (Paid) and "متبقي" (Remaining) columns
- Payment recording functionality will work correctly
- Check-booking page will display payment status
- All existing bookings will show 0 paid, full amount remaining

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify column names match exactly
3. Ensure data types are correct
4. Contact: Mohammed@azab.io
