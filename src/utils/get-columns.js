#!/usr/bin/env node
/**
 * Check exact columns in table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function getExactColumns() {
    console.log('🔍 Getting Exact Table Columns');
    console.log('═════════════════════════════');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Insert minimal record to see what columns are actually available
        const minimalRecord = {
            id: 'column-test-' + Date.now(),
            name: 'Test',
            phone: '123',
            date: '2025-08-02',
            time: '10:00'
        };
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([minimalRecord])
            .select();
            
        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }
        
        if (data && data[0]) {
            console.log('📋 Available columns in bookings table:');
            const columns = Object.keys(data[0]).sort();
            columns.forEach(column => {
                console.log(`   ✓ ${column}`);
            });
            
            console.log('\n📝 Sample data:');
            console.log(JSON.stringify(data[0], null, 2));
        }
        
        // Clean up
        await supabase.from('bookings').delete().eq('id', minimalRecord.id);
        console.log('\n🧹 Test record cleaned up');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getExactColumns();
