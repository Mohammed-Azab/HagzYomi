#!/usr/bin/env node
/**
 * Test Booking API Endpoint
 */

require('dotenv').config();

async function testBookingAPI() {
    console.log('🧪 Testing Booking API Endpoint');
    console.log('═══════════════════════════════');
    
    const baseUrl = 'http://localhost:3000';
    
    const testBooking = {
        name: 'اختبار المستخدم',
        phone: '01234567890',
        date: '2025-08-03',
        time: '14:00',
        duration: 60,
        isRecurring: false,
        recurringWeeks: 1
    };
    
    try {
        console.log('📤 Sending booking request...');
        console.log('Data:', JSON.stringify(testBooking, null, 2));
        
        const response = await fetch(`${baseUrl}/api/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBooking)
        });
        
        console.log(`📥 Response status: ${response.status} ${response.statusText}`);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        try {
            const result = JSON.parse(responseText);
            console.log('✅ Parsed JSON:', JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('🎉 Booking API is working correctly!');
                console.log(`📋 Booking Number: ${result.booking.bookingNumber}`);
            } else {
                console.log('❌ Booking failed:', result.message);
            }
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.error('Response was not valid JSON');
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

// Make sure server is running first
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000/api/config');
        if (response.ok) {
            console.log('✅ Server is running');
            return true;
        }
    } catch (error) {
        console.log('❌ Server is not running. Please start it with: npm start');
        return false;
    }
    return false;
}

async function main() {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await testBookingAPI();
    }
}

main();
