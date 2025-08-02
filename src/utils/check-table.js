#!/usr/bin/env node
/**
 * Check Table Structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTableStructure() {
    console.log('🔍 Checking Table Structure');
    console.log('═══════════════════════════');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Get table columns
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('📋 Table columns found:');
            Object.keys(data[0]).forEach(column => {
                console.log(`   - ${column}`);
            });
        } else {
            console.log('📝 Table is empty, checking with INSERT to see structure...');
            
            // Try to insert a test record to see what columns exist
            const testRecord = {
                id: 'structure-test-' + Date.now(),
                name: 'Test',
                phone: '123',
                date: '2025-08-02',
                time: '10:00'
            };
            
            const { data: insertData, error: insertError } = await supabase
                .from('bookings')
                .insert([testRecord])
                .select();
                
            if (insertError) {
                console.error('❌ Insert error:', insertError.message);
            } else {
                console.log('✅ Test insert successful');
                console.log('📋 Columns in inserted record:');
                if (insertData && insertData[0]) {
                    Object.keys(insertData[0]).forEach(column => {
                        console.log(`   - ${column}`);
                    });
                }
                
                // Clean up
                await supabase.from('bookings').delete().eq('id', testRecord.id);
                console.log('🧹 Test record cleaned up');
            }
        }
        
    } catch (error) {
        console.error('❌ Connection error:', error.message);
    }
}

checkTableStructure();
