#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests Supabase connection and table existence
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
    console.log('🔍 Testing Supabase Database Connection');
    console.log('═══════════════════════════════════════');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        console.log('✅ Supabase client created successfully');
        
        // Test basic connection
        console.log('🔗 Testing database connection...');
        const { data, error } = await supabase.from('bookings').select('count', { count: 'exact' });
        
        if (error) {
            if (error.message.includes('relation "public.bookings" does not exist')) {
                console.log('❌ Table "bookings" does not exist');
                console.log('');
                console.log('📋 You need to create the bookings table in Supabase:');
                console.log('   1. Go to your Supabase project dashboard');
                console.log('   2. Navigate to SQL Editor');
                console.log('   3. Run the following SQL:');
                console.log('');
                console.log('CREATE TABLE IF NOT EXISTS bookings (');
                console.log('    id TEXT PRIMARY KEY,');
                console.log('    groupId TEXT,');
                console.log('    bookingNumber TEXT,');
                console.log('    name TEXT NOT NULL,');
                console.log('    phone TEXT NOT NULL,');
                console.log('    date TEXT NOT NULL,');
                console.log('    time TEXT NOT NULL,');
                console.log('    duration INTEGER DEFAULT 30,');
                console.log('    totalSlots INTEGER,');
                console.log('    slotIndex INTEGER,');
                console.log('    startTime TEXT,');
                console.log('    endTime TEXT,');
                console.log('    createdAt TIMESTAMP DEFAULT NOW(),');
                console.log('    price REAL DEFAULT 0,');
                console.log('    status TEXT DEFAULT \'confirmed\',');
                console.log('    expiresAt TIMESTAMP,');
                console.log('    confirmedAt TIMESTAMP,');
                console.log('    declinedAt TIMESTAMP,');
                console.log('    isRecurring BOOLEAN DEFAULT false,');
                console.log('    recurringWeeks INTEGER DEFAULT 1,');
                console.log('    bookingDates TEXT,');
                console.log('    paymentInfo TEXT');
                console.log(');');
                console.log('');
                console.log('   4. Click "Run" to create the table');
                return false;
            } else {
                console.log('❌ Database error:', error.message);
                return false;
            }
        }
        
        console.log('✅ Database connection successful');
        console.log(`📊 Current bookings count: ${data ? data.length : 0}`);
        
        // Test insert capability
        console.log('🧪 Testing insert capability...');
        const testBooking = {
            id: 'test-' + Date.now(),
            name: 'Test User',
            phone: '1234567890',
            date: '2025-08-02',
            time: '10:00',
            duration: 30,
            status: 'test'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('bookings')
            .insert([testBooking])
            .select();
            
        if (insertError) {
            console.log('❌ Insert test failed:', insertError.message);
            return false;
        }
        
        console.log('✅ Insert test successful');
        
        // Clean up test booking
        await supabase.from('bookings').delete().eq('id', testBooking.id);
        console.log('🧹 Test data cleaned up');
        
        console.log('');
        console.log('🎉 DATABASE IS FULLY FUNCTIONAL!');
        return true;
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        return false;
    }
}

testDatabase().then(success => {
    if (!success) {
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
