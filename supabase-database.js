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
        // Get Supabase credentials from environment variables
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
            console.error('📋 Please set up Supabase first:');
            console.error('   1. Run: npm run setup-supabase');
            console.error('   2. Or read: SUPABASE_SETUP.md');
            console.error('   3. Restart server after configuration');
            console.error('');
            console.error('🚀 FOR RENDER.COM DEPLOYMENT:');
            console.error('   1. Go to your Render service dashboard');
            console.error('   2. Click "Environment" tab');
            console.error('   3. Add SUPABASE_URL and SUPABASE_ANON_KEY');
            console.error('   4. Click "Manual Deploy" to restart');
            console.error('   📖 See: RENDER_ENVIRONMENT_SETUP.md');
            process.exit(1);
        }
        
        try {
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Connected to Supabase cloud database');
        } catch (error) {
            console.error('❌ Failed to connect to Supabase:', error.message);
            process.exit(1);
        }
    }

    async getAllBookings() {
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
            console.error('Database error:', error);
            return [];
        }
    }

    async createBooking(booking) {
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
        // Supabase doesn't need explicit closing
        console.log('ℹ️  Supabase connection closed');
    }

    // Setup method to create the bookings table in Supabase
    async setupTable() {
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
