/**
 * Database Migration Script - Add Payment Tracking Columns
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @description Adds payment tracking columns to the bookings table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addPaymentColumns() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔄 Adding payment tracking columns to bookings table...');
    
    try {
        // Add payment tracking columns using SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN DEFAULT false;
            `
        });
        
        if (error) {
            console.error('❌ Error adding columns:', error);
            console.log('ℹ️  Note: This might be expected if columns already exist or if you need to add them manually in Supabase dashboard');
            console.log('📋 SQL to run manually in Supabase SQL Editor:');
            console.log(`
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN DEFAULT false;
            `);
        } else {
            console.log('✅ Payment columns added successfully');
        }
        
        // Update existing bookings with initial payment values
        console.log('🔄 Updating existing bookings with initial payment values...');
        
        const { data: updateData, error: updateError } = await supabase.rpc('exec_sql', {
            sql: `
                UPDATE bookings 
                SET 
                    paid_amount = 0,
                    remaining_amount = price,
                    payment_history = '[]'::jsonb,
                    fully_paid = false
                WHERE paid_amount IS NULL;
            `
        });
        
        if (updateError) {
            console.error('❌ Error updating existing bookings:', updateError);
            console.log('📋 SQL to run manually to update existing bookings:');
            console.log(`
UPDATE bookings 
SET 
    paid_amount = 0,
    remaining_amount = price,
    payment_history = '[]'::jsonb,
    fully_paid = false
WHERE paid_amount IS NULL;
            `);
        } else {
            console.log('✅ Existing bookings updated with payment information');
        }
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        console.log('\n📋 Manual SQL commands to run in Supabase dashboard:');
        console.log(`
-- Add payment tracking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN DEFAULT false;

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
}

// Run the migration
addPaymentColumns().then(() => {
    console.log('🏁 Migration script finished');
    process.exit(0);
}).catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
