#!/usr/bin/env node
/**
 * Test Frontend Issue - Direct Booking Test
 */

async function testBookingFlow() {
    console.log('🧪 Testing Complete Booking Flow');
    console.log('═══════════════════════════════');
    
    const testBooking = {
        name: 'Frontend Test User',
        phone: '01234567890',
        date: '2025-08-05',
        time: '15:00',
        duration: 60
    };
    
    try {
        console.log('📤 Making booking request...');
        
        const response = await fetch('http://localhost:3000/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBooking)
        });
        
        console.log(`📥 Response status: ${response.status}`);
        console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Raw response text:');
        console.log(responseText);
        console.log('');
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('✅ Successfully parsed JSON');
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            console.error('Response was not valid JSON');
            return;
        }
        
        console.log('📋 Parsed result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('🎉 Booking successful!');
            console.log(`📋 Booking Number: ${result.booking.bookingNumber}`);
            console.log(`📋 Status: ${result.booking.status}`);
            console.log(`📋 Message: ${result.message}`);
            
            // This is what the frontend should do
            console.log('');
            console.log('📱 Frontend should now:');
            console.log('1. Call showSuccess() function');
            console.log('2. Display success modal');
            console.log('3. Show booking details');
            
        } else {
            console.log('❌ Booking failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testBookingFlow();
