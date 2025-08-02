/**
 * HagzYomi - Football Court Booking System with Supabase Cloud Database
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @description Server-side application for football court booking system using Supabase
 */

// Load environment variables from .env file (for local development)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
// Database
const SupabaseDatabase = require('./supabase-database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new SupabaseDatabase();

// Load configuration from config.json
let config;
try {
    const configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    config = JSON.parse(configFile);
    
    // Add admin passwords from environment
    config.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    config.superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    
    console.log('✅ Configuration loaded from config.json');
} catch (error) {
    console.error('❌ Error loading config.json:', error.message);
    
    // Fallback to default configuration
    config = {
        courtName: "ملعب كرة القدم",
        openingHours: { start: "08:00", end: "22:00" },
        workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        maxHoursPerPersonPerDay: 2,
        slotDurationMinutes: 30,
        currency: "جنيه",
        pricePerHour: 50,
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
        contactInfo: { phone: "01234567890", email: "info@hagzyomi.com" },
        paymentInfo: { vodafoneCash: "01234567890", instaPay: "محمد عزب", instructions: "يرجى إرسال قيمة الحجز خلال ساعة واحدة لتأكيد الحجز" }
    };
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'hagz-yomi-secret',
    resave: false,
    saveUninitialized: true
}));

// Serve static files
app.use(express.static(__dirname));

// Helper functions
async function loadBookings() {
    try {
        return await db.getAllBookings();
    } catch (error) {
        console.error('Error loading bookings from database:', error);
        return [];
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isWorkingDay(date) {
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayIndex = new Date(date).getDay();
    const dayName = dayNames[dayIndex];
    return config.workingDays.includes(dayName);
}

function getTimeSlots() {
    const slots = [];
    const [startHour, startMinute] = config.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = config.openingHours.end.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour < startHour ? (endHour + 24) * 60 + endMinute : endHour * 60 + endMinute;
    
    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60) % 24;
        const minutes = currentMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
        currentMinutes += config.slotDurationMinutes;
    }
    
    return slots;
}

async function getUserBookingHours(phone, date) {
    const bookings = await loadBookings();
    const userBookings = bookings.filter(booking => 
        booking.phone === phone && 
        booking.date === date && 
        booking.status !== 'cancelled'
    );
    
    const uniqueBookings = new Map();
    userBookings.forEach(booking => {
        const groupId = booking.groupId || booking.id;
        if (!uniqueBookings.has(groupId)) {
            const duration = booking.duration || config.slotDurationMinutes;
            uniqueBookings.set(groupId, duration / 60);
        }
    });
    
    return Array.from(uniqueBookings.values()).reduce((total, hours) => total + hours, 0);
}

function generateBookingNumber() {
    const prefix = 'HY';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return prefix + timestamp + random;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// API Routes
app.get('/api/config', (req, res) => {
    const publicConfig = { ...config };
    delete publicConfig.adminPassword;
    delete publicConfig.superAdminPassword;
    res.json(publicConfig);
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'كلمة المرور مطلوبة' });
    }
    
    let role = 'admin';
    let isValidPassword = false;
    
    if (password === config.superAdminPassword && config.superAdminPassword) {
        role = 'superAdmin';
        isValidPassword = true;
    } else if (password === config.adminPassword) {
        isValidPassword = true;
    }
    
    if (!isValidPassword) {
        return res.status(401).json({ error: 'كلمة مرور خاطئة' });
    }
    
    req.session.isAdmin = true;
    req.session.adminRole = role;
    
    res.json({ 
        success: true, 
        role: role,
        isSuperAdmin: role === 'superAdmin'
    });
});

// Get user role
app.get('/api/admin/user-role', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    res.json({ 
        role: req.session.adminRole || 'admin',
        isSuperAdmin: req.session.adminRole === 'superAdmin'
    });
});

// Get available slots
app.get('/api/slots/:date', async (req, res) => {
    const { date } = req.params;
    
    if (!isWorkingDay(date)) {
        return res.json({ available: false, message: 'يوم إجازة' });
    }
    
    try {
        const bookings = await loadBookings();
        const bookedSlots = bookings
            .filter(booking => booking.date === date)
            .map(booking => booking.time);
        
        const allSlots = getTimeSlots();
        const now = new Date();
        
        const availableSlots = allSlots.filter(slot => {
            if (bookedSlots.includes(slot)) return false;
            
            const [slotHour] = slot.split(':').map(Number);
            const [startHour] = config.openingHours.start.split(':').map(Number);
            const [endHour] = config.openingHours.end.split(':').map(Number);
            
            let slotDateTime = new Date(`${date}T${slot}:00`);
            
            if (endHour <= startHour && slotHour < startHour) {
                slotDateTime.setDate(slotDateTime.getDate() + 1);
            }
            
            return slotDateTime > now;
        });
        
        res.json({
            available: true,
            slots: availableSlots,
            bookedSlots: bookedSlots
        });
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
    }
});

// Create booking
app.post('/api/book', async (req, res) => {
    const { name, phone, date, time, duration = 30, isRecurring = false, recurringWeeks = 1 } = req.body;
    
    try {
        // Basic validation
        if (!name || !phone || !date || !time) {
            return res.json({ success: false, message: 'جميع البيانات مطلوبة' });
        }
        
        if (!isWorkingDay(date)) {
            return res.json({ success: false, message: 'لا يمكن الحجز في هذا اليوم' });
        }
        
        // Validate duration
        if (![30, 60, 90, 120].includes(duration)) {
            return res.json({ success: false, message: 'مدة الحجز غير صحيحة' });
        }
        
        // Check if booking time is in the past
        const now = new Date();
        let bookingDateTime = new Date(`${date}T${time}:00`);
        
        if (bookingDateTime <= now) {
            return res.json({ success: false, message: 'لا يمكن الحجز في وقت سابق' });
        }
        
        const bookings = await loadBookings();
        
        // Generate time slots needed
        const timeSlots = [];
        const allSlots = getTimeSlots();
        const startIndex = allSlots.indexOf(time);
        
        if (startIndex === -1) {
            return res.json({ success: false, message: 'وقت غير صحيح' });
        }
        
        const slotsNeeded = duration / config.slotDurationMinutes;
        
        if (startIndex + slotsNeeded > allSlots.length) {
            return res.json({ success: false, message: 'لا توجد مواعيد كافية متتالية' });
        }
        
        for (let i = 0; i < slotsNeeded; i++) {
            timeSlots.push(allSlots[startIndex + i]);
        }
        
        // Check if slots are available
        for (const slot of timeSlots) {
            const existingBooking = bookings.find(booking => 
                booking.date === date && booking.time === slot
            );
            
            if (existingBooking) {
                return res.json({ success: false, message: `الموعد ${slot} محجوز بالفعل` });
            }
        }
        
        // Check daily limit
        const userDailyHours = await getUserBookingHours(phone, date);
        const bookingHours = duration / 60;
        
        if (userDailyHours + bookingHours > config.maxHoursPerPersonPerDay) {
            return res.json({ 
                success: false, 
                message: `تجاوزت الحد الأقصى للحجز (${config.maxHoursPerPersonPerDay} ساعات يومياً)` 
            });
        }
        
        // Create booking
        const bookingId = Date.now().toString();
        const bookingNumber = generateBookingNumber();
        const requirePaymentConfirmation = config.features && config.features.requirePaymentConfirmation || false;
        const status = requirePaymentConfirmation ? 'pending' : 'confirmed';
        const totalPrice = config.pricePerHour * bookingHours;
        
        let allBookingDates = [date];
        
        // Handle recurring bookings
        if (isRecurring && recurringWeeks > 1) {
            const maxRecurringWeeks = config.features && config.features.maxRecurringWeeks || 8;
            if (recurringWeeks > maxRecurringWeeks) {
                return res.json({ 
                    success: false, 
                    message: `الحد الأقصى للحجز المتكرر هو ${maxRecurringWeeks} أسابيع` 
                });
            }
            
            for (let week = 1; week < recurringWeeks; week++) {
                const recurringDate = new Date(date);
                recurringDate.setDate(recurringDate.getDate() + (week * 7));
                const recurringDateStr = recurringDate.toISOString().split('T')[0];
                allBookingDates.push(recurringDateStr);
            }
        }
        
        // Create all booking entries
        let bookingIndex = 0;
        for (const bookingDate of allBookingDates) {
            for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
                const booking = {
                    id: `${bookingId}-${bookingIndex}`,
                    groupId: bookingId,
                    bookingNumber: bookingNumber,
                    name,
                    phone,
                    date: bookingDate,
                    time: timeSlots[slotIndex],
                    duration: duration,
                    totalSlots: timeSlots.length,
                    slotIndex: slotIndex,
                    startTime: time,
                    endTime: timeSlots[timeSlots.length - 1],
                    createdAt: new Date().toISOString(),
                    price: (bookingIndex === 0 && slotIndex === 0) ? totalPrice * allBookingDates.length : 0,
                    status: status,
                    expiresAt: requirePaymentConfirmation ? 
                        new Date(Date.now() + (config.features && config.features.paymentTimeoutMinutes || 60) * 60 * 1000).toISOString() : 
                        null,
                    isRecurring: isRecurring,
                    recurringWeeks: recurringWeeks,
                    bookingDates: allBookingDates
                };
                
                if (requirePaymentConfirmation) {
                    booking.paymentInfo = config.paymentInfo;
                }
                
                await db.createBooking(booking);
                bookingIndex++;
            }
        }
        
        const response = { 
            success: true, 
            booking: {
                id: bookingId,
                bookingNumber: bookingNumber,
                name,
                phone,
                date,
                startTime: time,
                duration,
                price: totalPrice * allBookingDates.length,
                status: status,
                slots: timeSlots,
                isRecurring: isRecurring,
                recurringWeeks: recurringWeeks,
                bookingDates: allBookingDates
            }
        };
        
        if (requirePaymentConfirmation) {
            response.booking.paymentInfo = config.paymentInfo;
            response.message = `تم إنشاء الحجز برقم ${bookingNumber}. يرجى الدفع خلال ${config.features && config.features.paymentTimeoutMinutes || 60} دقيقة لتأكيد الحجز.`;
        } else {
            response.message = `تم تأكيد الحجز برقم ${bookingNumber} بنجاح!`;
        }
        
        res.json(response);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات' });
    }
});

// Get admin bookings
app.get('/api/admin/bookings', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    try {
        const bookings = await loadBookings();
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
    }
});

// Update booking status
app.post('/api/confirm-booking', async (req, res) => {
    try {
        const { bookingNumber, action } = req.body;
        
        if (!bookingNumber || !action) {
            return res.json({ success: false, message: 'رقم الحجز والإجراء مطلوبان' });
        }
        
        const bookings = await loadBookings();
        const groupBookings = bookings.filter(b => b.bookingNumber === bookingNumber);
        
        if (groupBookings.length === 0) {
            return res.json({ success: false, message: 'لم يتم العثور على الحجز' });
        }
        
        const updates = {};
        if (action === 'confirm') {
            updates.status = 'confirmed';
            updates.confirmedAt = new Date().toISOString();
        } else if (action === 'decline') {
            updates.status = 'declined';
            updates.declinedAt = new Date().toISOString();
        }
        
        for (const booking of groupBookings) {
            await db.updateBooking(booking.id, updates);
        }
        
        res.json({ success: true, message: `تم ${action === 'confirm' ? 'تأكيد' : 'رفض'} الحجز بنجاح` });
        
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات' });
    }
});

// Delete booking
app.delete('/api/admin/booking/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    try {
        const { id } = req.params;
        const result = await db.deleteBooking(id);
        
        if (result.changes === 0) {
            return res.json({ success: false, message: 'الحجز غير موجود' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات' });
    }
});

// Update configuration (super admin only)
app.post('/api/admin/update-config', async (req, res) => {
    if (!req.session.isAdmin || req.session.adminRole !== 'superAdmin') {
        return res.status(403).json({ error: 'غير مصرح - مطلوب صلاحيات المدير الأعلى' });
    }
    
    try {
        const newConfig = req.body;
        
        // Preserve sensitive fields
        newConfig.adminPassword = config.adminPassword;
        newConfig.superAdminPassword = config.superAdminPassword;
        
        // Update config file
        fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2));
        
        // Update in-memory config
        Object.assign(config, newConfig);
        
        res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'خطأ في حفظ الإعدادات' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.json({ success: true });
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 HagzYomi - Football Court Booking System');
    console.log('💻 Developed by: Mohammed Azab');
    console.log('📧 Contact: Mohammed@azab.io');
    console.log('© 2025 Mohammed Azab. All rights reserved.');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log('📊 Admin panel available at /admin');
    console.log(`🔑 Admin password: ${config.adminPassword || 'Not set'}`);
    console.log('🎯 Render deployment ready! 🌟');
    console.log('🗄️ Using Supabase cloud database for data persistence');
    console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Shutting down gracefully...');
    db.close();
    process.exit(0);
});
