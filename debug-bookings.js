#!/usr/bin/env node
/**
 * Debug Current Bookings
 */

require('dotenv').config();
const SupabaseDatabase = require('./supabase-database');

async function debugBookings() {
    console.log('🔍 Debugging Current Bookings');
    console.log('═══════════════════════════════');
    
    try {
        const db = new SupabaseDatabase();
        const bookings = await db.getAllBookings();
        
        console.log(`📊 Total bookings found: ${bookings.length}`);
        
        if (bookings.length > 0) {
            console.log('\n📋 Current bookings:');
            bookings.forEach((booking, index) => {
                console.log(`${index + 1}. ID: ${booking.id}`);
                console.log(`   Name: ${booking.name}`);
                console.log(`   Phone: ${booking.phone}`);
                console.log(`   Date: ${booking.date}`);
                console.log(`   Time: ${booking.time}`);
                console.log(`   Status: ${booking.status}`);
                console.log(`   Created: ${booking.createdAt}`);
                console.log('   ---');
            });
        } else {
            console.log('📝 No bookings found');
        }
        
    } catch (error) {
        console.error('❌ Error fetching bookings:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugBookings();
