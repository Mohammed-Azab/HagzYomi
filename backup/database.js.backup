const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'hagz_yomi.db');
        this.db = null;
        this.ensureDataDirectory();
        this.init();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
                this.createTables(() => {
                    // Run migration after tables are created
                    this.migrateFromJSON();
                });
            }
        });
    }

    createTables(callback) {
        const bookingsTable = `
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                groupId TEXT NOT NULL,
                bookingNumber TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                duration INTEGER NOT NULL,
                totalSlots INTEGER NOT NULL,
                slotIndex INTEGER NOT NULL,
                startTime TEXT NOT NULL,
                endTime TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                price REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                expiresAt TEXT,
                isRecurring BOOLEAN DEFAULT 0,
                recurringWeeks INTEGER DEFAULT 0,
                bookingDates TEXT, -- JSON string of dates array
                paymentInfo TEXT, -- JSON string of payment info
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Configuration table for storing app settings
        const configTable = `
            CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Admin sessions table
        const sessionsTable = `
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                expiresAt TEXT NOT NULL
            )
        `;

        this.db.run(bookingsTable, (err) => {
            if (err) console.error('Error creating bookings table:', err);
        });

        this.db.run(configTable, (err) => {
            if (err) console.error('Error creating config table:', err);
        });

        this.db.run(sessionsTable, (err) => {
            if (err) console.error('Error creating sessions table:', err);
            // Call callback after all tables are created
            if (callback) callback();
        });
    }

    migrateFromJSON() {
        const jsonPath = path.join(__dirname, 'data', 'bookings.json');
        
        if (fs.existsSync(jsonPath)) {
            try {
                const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                
                // Check if we already have data in the database
                this.db.get("SELECT COUNT(*) as count FROM bookings", (err, row) => {
                    if (err) {
                        console.error('Error checking existing data:', err);
                        return;
                    }
                    
                    if (row.count === 0 && jsonData.bookings && jsonData.bookings.length > 0) {
                        console.log('🔄 Migrating data from JSON to SQLite...');
                        
                        const stmt = this.db.prepare(`
                            INSERT INTO bookings (
                                id, groupId, bookingNumber, name, phone, date, time, 
                                duration, totalSlots, slotIndex, startTime, endTime, 
                                createdAt, price, status, expiresAt, isRecurring, 
                                recurringWeeks, bookingDates, paymentInfo
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);
                        
                        let migrated = 0;
                        jsonData.bookings.forEach(booking => {
                            stmt.run([
                                booking.id,
                                booking.groupId,
                                booking.bookingNumber,
                                booking.name,
                                booking.phone,
                                booking.date,
                                booking.time,
                                booking.duration,
                                booking.totalSlots,
                                booking.slotIndex,
                                booking.startTime,
                                booking.endTime,
                                booking.createdAt,
                                booking.price || 0,
                                booking.status || 'pending',
                                booking.expiresAt,
                                booking.isRecurring ? 1 : 0,
                                booking.recurringWeeks || 0,
                                booking.bookingDates ? JSON.stringify(booking.bookingDates) : null,
                                booking.paymentInfo ? JSON.stringify(booking.paymentInfo) : null
                            ], (err) => {
                                if (err) {
                                    console.error('Error migrating booking:', booking.id, err);
                                } else {
                                    migrated++;
                                }
                            });
                        });
                        
                        stmt.finalize(() => {
                            console.log(`✅ Successfully migrated ${migrated} bookings from JSON to SQLite`);
                            
                            // Backup the original JSON file
                            const backupPath = jsonPath + '.backup.' + Date.now();
                            fs.copyFileSync(jsonPath, backupPath);
                            console.log(`📁 JSON backup created at: ${backupPath}`);
                        });
                    }
                });
            } catch (error) {
                console.error('Error reading JSON file:', error);
            }
        }
    }

    // Booking operations
    async getAllBookings() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM bookings ORDER BY createdAt DESC", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse JSON fields
                    const bookings = rows.map(row => ({
                        ...row,
                        isRecurring: row.isRecurring === 1,
                        bookingDates: row.bookingDates ? JSON.parse(row.bookingDates) : null,
                        paymentInfo: row.paymentInfo ? JSON.parse(row.paymentInfo) : null
                    }));
                    resolve(bookings);
                }
            });
        });
    }

    async getBookingById(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM bookings WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    const booking = {
                        ...row,
                        isRecurring: row.isRecurring === 1,
                        bookingDates: row.bookingDates ? JSON.parse(row.bookingDates) : null,
                        paymentInfo: row.paymentInfo ? JSON.parse(row.paymentInfo) : null
                    };
                    resolve(booking);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async getBookingsByGroupId(groupId) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM bookings WHERE groupId = ? ORDER BY date, slotIndex", [groupId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const bookings = rows.map(row => ({
                        ...row,
                        isRecurring: row.isRecurring === 1,
                        bookingDates: row.bookingDates ? JSON.parse(row.bookingDates) : null,
                        paymentInfo: row.paymentInfo ? JSON.parse(row.paymentInfo) : null
                    }));
                    resolve(bookings);
                }
            });
        });
    }

    async createBooking(booking) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO bookings (
                    id, groupId, bookingNumber, name, phone, date, time, 
                    duration, totalSlots, slotIndex, startTime, endTime, 
                    createdAt, price, status, expiresAt, isRecurring, 
                    recurringWeeks, bookingDates, paymentInfo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                booking.id,
                booking.groupId,
                booking.bookingNumber,
                booking.name,
                booking.phone,
                booking.date,
                booking.time,
                booking.duration,
                booking.totalSlots,
                booking.slotIndex,
                booking.startTime,
                booking.endTime,
                booking.createdAt,
                booking.price || 0,
                booking.status || 'pending',
                booking.expiresAt,
                booking.isRecurring ? 1 : 0,
                booking.recurringWeeks || 0,
                booking.bookingDates ? JSON.stringify(booking.bookingDates) : null,
                booking.paymentInfo ? JSON.stringify(booking.paymentInfo) : null
            ], function(err) {
                stmt.finalize();
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: booking.id, changes: this.changes });
                }
            });
        });
    }

    async updateBooking(id, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            
            Object.keys(updates).forEach(key => {
                if (key === 'bookingDates' || key === 'paymentInfo') {
                    fields.push(`${key} = ?`);
                    values.push(updates[key] ? JSON.stringify(updates[key]) : null);
                } else if (key === 'isRecurring') {
                    fields.push(`${key} = ?`);
                    values.push(updates[key] ? 1 : 0);
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });
            
            fields.push('updatedAt = CURRENT_TIMESTAMP');
            values.push(id);
            
            const sql = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, changes: this.changes });
                }
            });
        });
    }

    async deleteBooking(id) {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM bookings WHERE id = ?", [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, changes: this.changes });
                }
            });
        });
    }

    async deleteBookingsByGroupId(groupId) {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM bookings WHERE groupId = ?", [groupId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ groupId, changes: this.changes });
                }
            });
        });
    }

    // Configuration operations
    async getConfig(key) {
        return new Promise((resolve, reject) => {
            if (key) {
                this.db.get("SELECT value FROM app_config WHERE key = ?", [key], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row ? JSON.parse(row.value) : null);
                    }
                });
            } else {
                this.db.all("SELECT key, value FROM app_config", (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        const config = {};
                        rows.forEach(row => {
                            config[row.key] = JSON.parse(row.value);
                        });
                        resolve(config);
                    }
                });
            }
        });
    }

    async setConfig(key, value) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO app_config (key, value, updatedAt) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `);
            
            stmt.run([key, JSON.stringify(value)], function(err) {
                stmt.finalize();
                if (err) {
                    reject(err);
                } else {
                    resolve({ key, value, changes: this.changes });
                }
            });
        });
    }

    // Session operations
    async createSession(token, role, expiresAt) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO admin_sessions (token, role, expiresAt) 
                VALUES (?, ?, ?)
            `);
            
            stmt.run([token, role, expiresAt], function(err) {
                stmt.finalize();
                if (err) {
                    reject(err);
                } else {
                    resolve({ token, role, changes: this.changes });
                }
            });
        });
    }

    async getSession(token) {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT * FROM admin_sessions WHERE token = ? AND expiresAt > datetime('now')", 
                [token], 
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async deleteSession(token) {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM admin_sessions WHERE token = ?", [token], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ token, changes: this.changes });
                }
            });
        });
    }

    async cleanupExpiredSessions() {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM admin_sessions WHERE expiresAt <= datetime('now')", function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Utility methods
    async getBookingStats() {
        return new Promise((resolve, reject) => {
            const queries = {
                total: "SELECT COUNT(*) as count FROM bookings",
                confirmed: "SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'",
                pending: "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'",
                cancelled: "SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'",
                totalRevenue: "SELECT SUM(price) as total FROM bookings WHERE status = 'confirmed'"
            };

            const stats = {};
            const promises = Object.keys(queries).map(key => {
                return new Promise((resolve, reject) => {
                    this.db.get(queries[key], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            stats[key] = row.count || row.total || 0;
                            resolve();
                        }
                    });
                });
            });

            Promise.all(promises)
                .then(() => resolve(stats))
                .catch(reject);
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        }
    }
}

module.exports = Database;
