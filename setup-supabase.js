#!/usr/bin/env node

/**
 * Supabase Setup Helper for HagzYomi
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
🚀 HagzYomi Supabase Setup Helper
═══════════════════════════════

This will help you configure Supabase cloud database for your booking system.

First, create a free Supabase account:
1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new project named "HagzYomi"
4. Wait for project to be ready

Then return here with your credentials.
`);

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setup() {
    try {
        console.log('📝 Please provide your Supabase credentials:\n');
        
        const supabaseUrl = await askQuestion('🔗 Supabase Project URL (https://xxxxx.supabase.co): ');
        
        if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
            console.log('❌ Invalid URL. Please provide a valid Supabase URL.');
            process.exit(1);
        }
        
        const supabaseKey = await askQuestion('🔑 Supabase Anon Key (starts with eyJhbGciOiJIUzI1NiIs...): ');
        
        if (!supabaseKey || !supabaseKey.startsWith('eyJ')) {
            console.log('❌ Invalid key. Please provide a valid Supabase anon key.');
            process.exit(1);
        }
        
        // Create .env file
        const envContent = `# Supabase Configuration for HagzYomi
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}

# Add these to your Render.com environment variables for deployment
`;
        
        fs.writeFileSync('.env', envContent);
        console.log('\n✅ Created .env file with your Supabase credentials');
        
        // Update .gitignore to exclude .env
        const gitignorePath = '.gitignore';
        let gitignoreContent = '';
        
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        if (!gitignoreContent.includes('.env')) {
            gitignoreContent += '\n# Environment variables\n.env\n';
            fs.writeFileSync(gitignorePath, gitignoreContent);
            console.log('✅ Updated .gitignore to exclude .env file');
        }
        
        console.log(`
🎉 Configuration Complete!

Next steps:
1. 📋 Create the database table in Supabase:
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Run the SQL commands from SUPABASE_SETUP.md

2. 🔄 Restart your server:
   - Kill current server (Ctrl+C)
   - Run: npm start

3. 🚀 For deployment to Render.com:
   - Add these environment variables in Render dashboard:
     SUPABASE_URL=${supabaseUrl}
     SUPABASE_ANON_KEY=${supabaseKey}

4. 🧪 Test your setup:
   - Make a test booking
   - Check Supabase dashboard to see the data

📖 Full setup guide: SUPABASE_SETUP.md
`);
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

setup();
