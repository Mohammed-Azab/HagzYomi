# 🗄️ Database Integration - HagzYomi

## Overview

HagzYomi now uses **SQLite** as its primary database for data persistence, replacing the previous JSON file-based storage. This provides better performance, reliability, and data integrity.

## Features

- ✅ **SQLite Database**: Fast, reliable, serverless database
- ✅ **Automatic Migration**: Existing JSON data is automatically migrated to SQLite
- ✅ **Data Persistence**: All bookings, configurations, and sessions are stored in database
- ✅ **Backup System**: Original JSON files are backed up during migration
- ✅ **Database Tools**: Command-line tools for database management

## Database Schema

### Bookings Table
- `id` (TEXT PRIMARY KEY): Unique booking slot identifier
- `groupId` (TEXT): Groups related booking slots together
- `bookingNumber` (TEXT): User-friendly booking number
- `name`, `phone`: Customer information
- `date`, `time`: Booking date and time
- `duration`, `totalSlots`, `slotIndex`: Booking duration details
- `startTime`, `endTime`: Calculated booking times
- `price` (REAL): Booking price
- `status` (TEXT): confirmed/pending/cancelled/expired
- `isRecurring` (BOOLEAN): Whether this is a recurring booking
- `recurringWeeks` (INTEGER): Number of weeks for recurring bookings
- `bookingDates` (TEXT): JSON array of all booking dates
- `paymentInfo` (TEXT): JSON object with payment details
- `createdAt`, `updatedAt`: Timestamps

### Configuration Table
- `key` (TEXT PRIMARY KEY): Configuration key
- `value` (TEXT): JSON-encoded configuration value
- `updatedAt` (TEXT): Last update timestamp

### Admin Sessions Table
- `token` (TEXT PRIMARY KEY): Session token
- `role` (TEXT): admin/superAdmin
- `createdAt`, `expiresAt` (TEXT): Session timing

## Migration Process

When you first run the server with database integration:

1. **SQLite database file** is created at `data/hagz_yomi.db`
2. **Tables are created** automatically
3. **Existing JSON data** is migrated to the database
4. **JSON backup** is created (e.g., `bookings.json.backup.1754126061029`)
5. **Server continues** using the database for all operations

## Database Management

Use the included database management tool:

```bash
# Show database statistics
node db-tool.js stats

# Export database to JSON
node db-tool.js export

# Clean up expired bookings
node db-tool.js cleanup

# Optimize database
node db-tool.js vacuum

# Show help
node db-tool.js help
```

## Benefits

### Performance
- **Faster queries**: SQLite provides indexed searches
- **Concurrent access**: Multiple operations can be handled efficiently
- **Memory efficient**: Large datasets don't consume excessive RAM

### Reliability
- **ACID transactions**: Data integrity is guaranteed
- **Automatic recovery**: SQLite handles corruption gracefully
- **Backup-friendly**: Single file can be easily backed up

### Scalability
- **No size limits**: Can handle thousands of bookings
- **Query optimization**: Complex searches and reports are faster
- **Indexing**: Automatic indexing on primary keys and important fields

## File Structure

```
HagzYomi/
├── database.js           # Database class with all operations
├── server.js            # Updated server with database integration
├── db-tool.js           # Database management utility
└── data/
    ├── hagz_yomi.db     # SQLite database file
    ├── bookings.json    # Original JSON file (kept for reference)
    └── *.backup.*       # Automatic backups during migration
```

## Deployment Considerations

### For Render
- Database file is stored in persistent disk
- Automatic backups during deployments
- Environment variables for admin passwords

### For Railway/Vercel
- Database file persists between deployments
- Consider periodic exports for backup
- Monitor disk usage for large installations

## Backup Strategy

1. **Automatic backups** during migration
2. **Manual exports** using `node db-tool.js export`
3. **File-level backups** of `data/hagz_yomi.db`
4. **Version control** excludes database files (via .gitignore)

## Troubleshooting

### Database Locked
If you get "database is locked" errors:
```bash
# Stop all Node.js processes
pkill -f node
# Restart the server
node server.js
```

### Corruption Recovery
If database becomes corrupted:
```bash
# Export what's recoverable
node db-tool.js export
# Remove corrupted database
rm data/hagz_yomi.db
# Restart server (will recreate from JSON backup)
node server.js
```

### Performance Issues
If database becomes slow:
```bash
# Optimize database
node db-tool.js vacuum
# Clean up expired bookings
node db-tool.js cleanup
```

## Future Enhancements

- **PostgreSQL support** for larger installations
- **Cloud database integration** (MongoDB Atlas, PlanetScale)
- **Real-time synchronization** across multiple instances
- **Advanced analytics** and reporting
- **Data encryption** for sensitive information

## Technical Notes

- **Node.js SQLite3**: Uses the `sqlite3` package
- **Graceful shutdown**: Database connections are properly closed
- **Error handling**: Comprehensive error handling and logging
- **Async/await**: Modern JavaScript patterns throughout
- **Backward compatibility**: Can still read JSON files for migration

---

**Note**: The database integration is fully backward compatible. Your existing JSON-based data will be automatically migrated when you first start the server with the new version.
