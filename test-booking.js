#!/usr/bin/env node
/**
 * Test Booking Creation
 */

require('dotenv').config();
const SupabaseDatabase = require('./supabase-database');

async function testBookingCreation() {
    console.log('🧪 Testing Booking Creation');
    console.log('═══════════════════════════');
    
    try {
        const db = new SupabaseDatabase();
        
        // Create a test booking
        const testBooking = {
            id: 'test-booking-' + Date.now(),
            groupId: 'test-group-' + Date.now(),
            bookingNumber: 'HY' + Date.now().toString().slice(-6),
            name: 'اختبار المستخدم',
            phone: '01234567890',
            date: '2025-08-03',
            time: '14:00',
            duration: 60,
            totalSlots: 2,
            slotIndex: 0,
            startTime: '14:00',
            endTime: '15:00',
            createdAt: new Date().toISOString(),
            price: 100,
            status: 'confirmed',
            isRecurring: false,
            recurringWeeks: 1
        };
        
        console.log('📝 Creating test booking...');
        const created = await db.createBooking(testBooking);
        console.log('✅ Booking created successfully!');
        console.log('📋 Created booking details:');
        console.log(`   ID: ${created.id}`);
        console.log(`   Name: ${created.name}`);
        console.log(`   Phone: ${created.phone}`);
        console.log(`   Date: ${created.date}`);
        console.log(`   Time: ${created.time}`);
        console.log(`   Status: ${created.status}`);
        
        // Test fetching all bookings
        console.log('\n📊 Fetching all bookings...');
        const allBookings = await db.getAllBookings();
        console.log(`✅ Found ${allBookings.length} booking(s)`);
        
        // Clean up test booking
        console.log('\n🧹 Cleaning up test booking...');
        await db.deleteBooking(created.id);
        console.log('✅ Test booking deleted');
        
        console.log('\n🎉 ALL TESTS PASSED! Database is working correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testBookingCreation();
