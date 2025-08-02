#!/usr/bin/env node

/**
 * HagzYomi Database Management Tool
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @description Command-line tool for managing the HagzYomi SQLite database
 */

const Database = require('./database');
const fs = require('fs');
const path = require('path');

const db = new Database();

async function showStats() {
    console.log('📊 Database Statistics:');
    try {
        const stats = await db.getBookingStats();
        console.log(`   Total Bookings: ${stats.total}`);
        console.log(`   Confirmed: ${stats.confirmed}`);
        console.log(`   Pending: ${stats.pending}`);
        console.log(`   Cancelled: ${stats.cancelled}`);
        console.log(`   Total Revenue: ${stats.totalRevenue} جنيه`);
    } catch (error) {
        console.error('Error getting stats:', error);
    }
}

async function exportToJSON() {
    console.log('📤 Exporting database to JSON...');
    try {
        const bookings = await db.getAllBookings();
        const exportPath = path.join(__dirname, 'data', `export_${Date.now()}.json`);
        fs.writeFileSync(exportPath, JSON.stringify({ bookings }, null, 2));
        console.log(`✅ Database exported to: ${exportPath}`);
    } catch (error) {
        console.error('Error exporting:', error);
    }
}

async function cleanupExpired() {
    console.log('🧹 Cleaning up expired bookings...');
    try {
        const bookings = await db.getAllBookings();
        const now = new Date();
        let cleaned = 0;
        
        for (const booking of bookings) {
            if (booking.status === 'pending' && booking.expiresAt) {
                const expiresAt = new Date(booking.expiresAt);
                if (expiresAt < now) {
                    await db.updateBooking(booking.id, { status: 'expired' });
                    cleaned++;
                }
            }
        }
        
        console.log(`✅ Cleaned up ${cleaned} expired bookings`);
    } catch (error) {
        console.error('Error cleaning up:', error);
    }
}

async function vacuum() {
    console.log('🗜️ Optimizing database...');
    try {
        await new Promise((resolve, reject) => {
            db.db.run('VACUUM', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Database optimized');
    } catch (error) {
        console.error('Error optimizing database:', error);
    }
}

function showHelp() {
    console.log(`
🗄️ HagzYomi Database Management Tool

Usage: node db-tool.js [command]

Commands:
  stats     Show database statistics
  export    Export database to JSON
  cleanup   Clean up expired bookings
  vacuum    Optimize database
  help      Show this help message

Examples:
  node db-tool.js stats
  node db-tool.js export
  node db-tool.js cleanup
  node db-tool.js vacuum
`);
}

// Main execution
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'stats':
            await showStats();
            break;
        case 'export':
            await exportToJSON();
            break;
        case 'cleanup':
            await cleanupExpired();
            break;
        case 'vacuum':
            await vacuum();
            break;
        case 'help':
        case undefined:
            showHelp();
            break;
        default:
            console.log(`❌ Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
    
    db.close();
}

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    db.close();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    db.close();
    process.exit(1);
});

// Run the tool
main().catch(error => {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
});
