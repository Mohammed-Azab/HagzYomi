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
const SupabaseDatabase = require('./src/database/supabase-database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new SupabaseDatabase();

// Load configuration from config.json
let config;
try {
    const configFile = fs.readFileSync(path.join(__dirname, 'src/config/config.json'), 'utf8');
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
app.use(express.static('public'));

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin-login');
    }
    res.sendFile(path.join(__dirname, 'public/html/admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/admin-login.html'));
});

app.get('/check-booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/check-booking.html'));
});

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

app.get('/check-booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/check-booking.html'));
});

app.get('/check-booking.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/check-booking.html'));
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
        const totalBookings = allBookingDates.length * timeSlots.length;
        const pricePerBooking = Math.round((totalPrice) / timeSlots.length * 100) / 100; // Round to 2 decimal places
        
        console.log(`💰 Price distribution: Total=${totalPrice}, Duration=${duration}min, Slots=${timeSlots.length}, Weeks=${allBookingDates.length}, Per booking=${pricePerBooking}`);
        
        for (const bookingDate of allBookingDates) {
            for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
                // Calculate the actual end time by adding duration to start time
                const startTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
                const endTimeMinutes = startTimeMinutes + duration;
                const endHours = Math.floor(endTimeMinutes / 60) % 24;
                const endMins = endTimeMinutes % 60;
                const calculatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                
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
                    endTime: calculatedEndTime,
                    createdAt: new Date().toISOString(),
                    price: pricePerBooking,
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
        
        // Calculate the actual end time for the response
        const startTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
        const endTimeMinutes = startTimeMinutes + duration;
        const endHours = Math.floor(endTimeMinutes / 60) % 24;
        const endMins = endTimeMinutes % 60;
        const responseEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        
        const response = { 
            success: true, 
            booking: {
                id: bookingId,
                bookingNumber: bookingNumber,
                name,
                phone,
                date,
                startTime: time,
                endTime: responseEndTime,
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
        
        console.log('✅ Booking created successfully:', {
            bookingNumber,
            name,
            phone,
            date,
            time,
            totalBookings: bookingIndex
        });
        console.log('📤 Sending response:', JSON.stringify(response, null, 2));
        
        res.json(response);
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        console.error('Error stack:', error.stack);
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
        
        // Group bookings by booking number and calculate totals
        const groupedBookings = {};
        
        bookings.forEach(booking => {
            const bookingNumber = booking.bookingNumber;
            
            if (!groupedBookings[bookingNumber]) {
                // First booking in this group - use it as the base
                groupedBookings[bookingNumber] = {
                    ...booking,
                    totalPrice: 0,
                    allSlots: [],
                    allDates: new Set()
                };
            }
            
            // Add to totals
            groupedBookings[bookingNumber].totalPrice += (booking.price || 0);
            groupedBookings[bookingNumber].allSlots.push(booking.time);
            groupedBookings[bookingNumber].allDates.add(booking.date);
        });
        
        // Convert to array and format the results
        const result = Object.values(groupedBookings).map(group => ({
            id: group.id,
            bookingNumber: group.bookingNumber,
            name: group.name,
            phone: group.phone,
            date: group.date, // First date
            time: group.time, // First time slot
            duration: group.duration || 30,
            price: group.totalPrice, // Total price for all slots
            status: group.status,
            createdAt: group.createdAt,
            expiresAt: group.expiresAt,
            isRecurring: group.isRecurring || false,
            recurringWeeks: group.recurringWeeks || 1,
            // Additional info for display
            allDates: [...group.allDates].sort(),
            totalSlots: group.allSlots.length
        }));
        
        res.json(result);
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

// Check booking status
app.post('/api/check-booking', async (req, res) => {
    try {
        const { bookingNumber, name } = req.body;
        
        if (!bookingNumber || !name) {
            return res.json({ success: false, message: 'رقم الحجز/رقم الهاتف والاسم مطلوبان' });
        }
        
        const bookings = await loadBookings();
        
        // Search by either booking number OR phone number
        const booking = bookings.find(b => 
            (b.bookingNumber === bookingNumber || b.phone === bookingNumber) && 
            b.name.toLowerCase() === name.toLowerCase()
        );
        
        if (!booking) {
            return res.json({ success: false, message: 'لم يتم العثور على الحجز أو الاسم غير مطابق' });
        }
        
        // Get all bookings for this group to calculate total price and get booking dates
        const groupBookings = bookings.filter(b => b.groupId === booking.groupId);
        const totalPrice = groupBookings.reduce((sum, b) => sum + (b.price || 0), 0);
        const bookingDates = [...new Set(groupBookings.map(b => b.date))].sort();
        
        // Prepare response
        const bookingDetails = {
            id: booking.id,
            groupId: booking.groupId,
            bookingNumber: booking.bookingNumber,
            name: booking.name,
            phone: booking.phone,
            date: booking.date,
            time: booking.time,
            startTime: booking.startTime || booking.time,
            endTime: booking.endTime || booking.time,
            duration: booking.duration || 30,
            price: totalPrice,
            status: booking.status,
            createdAt: booking.createdAt,
            expiresAt: booking.expiresAt,
            isRecurring: booking.isRecurring || false,
            recurringWeeks: booking.recurringWeeks || 1,
            bookingDates: bookingDates,
            paymentInfo: booking.paymentInfo
        };
        
        res.json({ success: true, booking: bookingDetails });
        
    } catch (error) {
        console.error('Error checking booking:', error);
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

// Debug endpoint to check bookings (remove in production)
app.get('/api/debug/bookings', async (req, res) => {
    try {
        const bookings = await loadBookings();
        res.json({
            total: bookings.length,
            sample: bookings.slice(0, 5),
            dates: [...new Set(bookings.map(b => b.date))].sort()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate and download reports
app.get('/api/admin/report', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    try {
        const { format, type, date, weekDate, month, startDate, endDate } = req.query;
        
        console.log('Report request:', { format, type, date, weekDate, month, startDate, endDate });
        
        // Validate format
        if (!['csv', 'excel', 'pdf'].includes(format)) {
            return res.status(400).json({ error: 'صيغة غير صحيحة' });
        }
        
        // Get bookings based on report type
        let bookings = await loadBookings();
        console.log(`Total bookings in database: ${bookings.length}`);
        
        // Debug: show sample booking dates
        if (bookings.length > 0) {
            console.log('Sample booking dates:', bookings.slice(0, 3).map(b => b.date));
        }
        
        let filteredBookings = [];
        let reportTitle = '';
        
        switch (type) {
            case 'daily':
                if (!date) {
                    return res.status(400).json({ error: 'التاريخ مطلوب' });
                }
                filteredBookings = bookings.filter(booking => booking.date === date);
                reportTitle = `تقرير يومي - ${date}`;
                break;
                
            case 'weekly':
                if (!weekDate) {
                    return res.status(400).json({ error: 'تاريخ الأسبوع مطلوب' });
                }
                const weekStart = getWeekStart(weekDate);
                const weekEnd = getWeekEnd(weekDate);
                filteredBookings = bookings.filter(booking => 
                    booking.date >= weekStart && booking.date <= weekEnd
                );
                reportTitle = `تقرير أسبوعي - ${weekStart} إلى ${weekEnd}`;
                break;
                
            case 'monthly':
                if (!month) {
                    return res.status(400).json({ error: 'الشهر مطلوب' });
                }
                const [year, monthNum] = month.split('-');
                filteredBookings = bookings.filter(booking => 
                    booking.date.startsWith(`${year}-${monthNum}`)
                );
                reportTitle = `تقرير شهري - ${month}`;
                break;
                
            case 'custom':
                if (!startDate || !endDate) {
                    return res.status(400).json({ error: 'تاريخ البداية والنهاية مطلوبان' });
                }
                filteredBookings = bookings.filter(booking => 
                    booking.date >= startDate && booking.date <= endDate
                );
                reportTitle = `تقرير مخصص - ${startDate} إلى ${endDate}`;
                break;
                
            default:
                return res.status(400).json({ error: 'نوع التقرير غير صحيح' });
        }
        
        console.log(`Found ${filteredBookings.length} bookings for report`);
        
        // Generate report based on format
        if (format === 'csv') {
            const csv = generateCSVReport(filteredBookings, reportTitle);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
            res.send('\ufeff' + csv); // Add BOM for Arabic support
        } else if (format === 'excel') {
            // For now, return CSV format but with Excel headers
            const csv = generateCSVReport(filteredBookings, reportTitle);
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
            res.send('\ufeff' + csv);
        } else if (format === 'pdf') {
            const html = generateHTMLReport(filteredBookings, reportTitle);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(html);
        }
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'خطأ في إنشاء التقرير' });
    }
});

// Helper functions for report generation
function getWeekStart(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday is 0
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
}

function getWeekEnd(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + 6; // Saturday is 6
    const weekEnd = new Date(date.setDate(diff));
    return weekEnd.toISOString().split('T')[0];
}

function generateCSVReport(bookings, title) {
    let csv = `${title}\n\n`;
    csv += 'رقم الحجز,الاسم,رقم الهاتف,التاريخ,الوقت,المدة,السعر,الحالة,وقت الحجز\n';
    
    if (bookings.length === 0) {
        csv += 'لا توجد بيانات للفترة المحددة\n';
    } else {
        bookings.forEach(booking => {
            const createdAt = new Date(booking.createdAt).toLocaleString('ar-EG');
            const status = getStatusTextForCSV(booking.status || 'confirmed');
            csv += `${booking.bookingNumber || booking.id},"${booking.name}","${booking.phone}","${booking.date}","${booking.time}","${booking.duration} دقيقة","${booking.price} جنيه","${status}","${createdAt}"\n`;
        });
    }
    
    // Add summary
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    
    csv += `\n\nملخص التقرير\n`;
    csv += `عدد الحجوزات,${totalBookings}\n`;
    csv += `إجمالي الإيرادات,"${totalRevenue} جنيه"\n`;
    
    return csv;
}

function generateHTMLReport(bookings, title) {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    
    let html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
            body { font-family: Cairo, Arial, sans-serif; margin: 20px; }
            h1 { color: #4CAF50; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #4CAF50; color: white; }
            .summary { background-color: #f5f5f5; padding: 15px; margin: 20px 0; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <h1>${title}</h1>
        <div class="summary">
            <strong>ملخص التقرير:</strong><br>
            عدد الحجوزات: ${totalBookings}<br>
            إجمالي الإيرادات: ${totalRevenue} جنيه
        </div>
        <table>
            <thead>
                <tr>
                    <th>رقم الحجز</th>
                    <th>الاسم</th>
                    <th>رقم الهاتف</th>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>المدة</th>
                    <th>السعر</th>
                    <th>الحالة</th>
                    <th>وقت الحجز</th>
                </tr>
            </thead>
            <tbody>`;
    
    if (bookings.length === 0) {
        html += `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 20px; color: #666;">
                        لا توجد بيانات للفترة المحددة
                    </td>
                </tr>`;
    } else {
        bookings.forEach(booking => {
            const createdAt = new Date(booking.createdAt).toLocaleString('ar-EG');
            const status = getStatusTextForCSV(booking.status || 'confirmed');
            html += `
                    <tr>
                        <td>${booking.bookingNumber || booking.id}</td>
                        <td>${booking.name}</td>
                        <td>${booking.phone}</td>
                        <td>${booking.date}</td>
                        <td>${booking.time}</td>
                        <td>${booking.duration} دقيقة</td>
                        <td>${booking.price} جنيه</td>
                        <td>${status}</td>
                        <td>${createdAt}</td>
                    </tr>`;
        });
    }
    
    html += `
            </tbody>
        </table>
    </body>
    </html>`;
    
    return html;
}

function getStatusTextForCSV(status) {
    switch(status) {
        case 'pending': return 'في انتظار الدفع';
        case 'confirmed': return 'مؤكد';
        case 'declined': return 'مرفوض';
        case 'expired': return 'منتهي الصلاحية';
        default: return 'مؤكد';
    }
}

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
