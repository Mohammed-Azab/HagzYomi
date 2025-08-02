#!/usr/bin/env node
/**
 * Environment Variables Test Script
 * Tests if Supabase environment variables are properly set
 */

require('dotenv').config();

console.log('🔍 Environment Variables Test');
console.log('═══════════════════════════════════');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('📊 Current Environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Platform: ${process.platform}`);
console.log('');

console.log('🔑 Supabase Configuration:');
if (supabaseUrl) {
    console.log(`   ✅ SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
} else {
    console.log('   ❌ SUPABASE_URL: Not set');
}

if (supabaseKey) {
    console.log(`   ✅ SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);
} else {
    console.log('   ❌ SUPABASE_ANON_KEY: Not set');
}

console.log('');

if (supabaseUrl && supabaseKey) {
    console.log('🎉 SUCCESS: All required environment variables are set!');
    console.log('   Your server should start without issues.');
} else {
    console.log('❌ MISSING: Required environment variables not found');
    console.log('');
    console.log('🚀 FOR LOCAL DEVELOPMENT:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Add your Supabase credentials');
    console.log('   3. Run this test again');
    console.log('');
    console.log('🚀 FOR RENDER.COM:');
    console.log('   1. Go to Render service dashboard');
    console.log('   2. Click "Environment" tab');
    console.log('   3. Add SUPABASE_URL and SUPABASE_ANON_KEY');
    console.log('   4. Click "Manual Deploy"');
    console.log('');
    console.log('📖 See: RENDER_ENVIRONMENT_SETUP.md');
    process.exit(1);
}

console.log('═══════════════════════════════════');
