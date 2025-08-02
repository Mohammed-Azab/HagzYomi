/**
 * Supabase Database Module for HagzYomi
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @description Cloud database using Supabase (free tier)
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseDatabase {
    constructor() {
        // You'll need to set these environment variables or add them to config
        this.supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
        this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
        
        if (this.supabaseUrl === 'YOUR_SUPABASE_URL' || this.supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.log('⚠️  Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables.');
            console.log('📋 For now, using SQLite as fallback...');
            this.useSupabase = false;
            // Fall back to SQLite
            const Database = require('./database');
            this.fallbackDb = new Database();
        } else {
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            this.useSupabase = true;
            console.log('✅ Connected to Supabase cloud database');
        }
    }

    async getAllBookings() {
        if (!this.useSupabase) {
            return this.fallbackDb.getAllBookings();
        }

        try {
            const { data, error } = await this.supabase
                .from('bookings')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching bookings from Supabase:', error);
            return [];
        }
    }

    async createBooking(booking) {
        if (!this.useSupabase) {
            return this.fallbackDb.createBooking(booking);
        }

        try {
            const { data, error } = await this.supabase
                .from('bookings')
                .insert([booking])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            return data[0];
        } catch (error) {
            console.error('Error creating booking in Supabase:', error);
            throw error;
        }
    }

    async updateBooking(id, updates) {
        if (!this.useSupabase) {
            return this.fallbackDb.updateBooking(id, updates);
        }

        try {
            const { data, error } = await this.supabase
                .from('bookings')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            return data[0];
        } catch (error) {
            console.error('Error updating booking in Supabase:', error);
            throw error;
        }
    }

    async deleteBooking(id) {
        if (!this.useSupabase) {
            return this.fallbackDb.deleteBooking(id);
        }

        try {
            const { error } = await this.supabase
                .from('bookings')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            return { changes: 1 };
        } catch (error) {
            console.error('Error deleting booking from Supabase:', error);
            throw error;
        }
    }

    close() {
        if (!this.useSupabase && this.fallbackDb) {
            this.fallbackDb.close();
        }
        // Supabase doesn't need explicit closing
    }

    // Setup method to create the bookings table in Supabase
    async setupTable() {
        if (!this.useSupabase) {
            console.log('Using SQLite, no table setup needed.');
            return;
        }

        console.log(`
📋 Supabase Table Setup Instructions:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run this SQL to create the bookings table:

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

4. Enable Row Level Security (RLS) if needed
5. Set up authentication rules as required

✅ After creating the table, restart your server.
`);
    }
}

module.exports = SupabaseDatabase;
