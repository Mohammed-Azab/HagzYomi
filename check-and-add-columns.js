/**
 * Check and Add Payment Columns to Supabase Database
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @description Checks if payment columns exist and adds them if needed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkAndAddColumns() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Checking current database schema...');
    
    try {
        // First, let's check if we can query the table at all
        const { data: existingBookings, error: queryError } = await supabase
            .from('bookings')
            .select('*')
            .limit(1);
            
        if (queryError) {
            console.error('❌ Error querying bookings table:', queryError);
            return;
        }
        
        console.log('✅ Successfully connected to bookings table');
        
        if (existingBookings && existingBookings.length > 0) {
            const booking = existingBookings[0];
            console.log('📊 Current booking structure:');
            console.log('   Columns found:', Object.keys(booking));
            
            // Check if payment columns exist
            const hasPaymentColumns = booking.hasOwnProperty('paid_amount') && 
                                    booking.hasOwnProperty('remaining_amount') && 
                                    booking.hasOwnProperty('payment_history') && 
                                    booking.hasOwnProperty('fully_paid');
            
            if (hasPaymentColumns) {
                console.log('✅ Payment columns already exist!');
                console.log('   - paid_amount:', booking.paid_amount);
                console.log('   - remaining_amount:', booking.remaining_amount);
                console.log('   - payment_history:', booking.payment_history);
                console.log('   - fully_paid:', booking.fully_paid);
            } else {
                console.log('❌ Payment columns are missing!');
                console.log('🔧 You need to add them manually in Supabase dashboard');
                console.log('\n📋 SQL to run in Supabase SQL Editor:');
                console.log(`
ALTER TABLE bookings 
ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN payment_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN fully_paid BOOLEAN DEFAULT false;

-- Update existing bookings
UPDATE bookings 
SET 
    paid_amount = 0,
    remaining_amount = price,
    payment_history = '[]'::jsonb,
    fully_paid = false
WHERE paid_amount IS NULL;
                `);
            }
        } else {
            console.log('ℹ️  No bookings found in table - columns will be created when first booking is made');
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

// Run the check
checkAndAddColumns().then(() => {
    console.log('🏁 Database check completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Check failed:', error);
    process.exit(1);
});
