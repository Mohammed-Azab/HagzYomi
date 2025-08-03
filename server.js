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

async function generateBookingNumber() {
    let bookingNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
        // Generate a simpler 6-digit number: DDHHNN
        // DD = day of month (01-31)
        // HH = hour (00-23) 
        // NN = random number (00-99)
        
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        bookingNumber = day + hour + random;
        
        // Check if this booking number already exists
        try {
            const existingBookings = await loadBookings();
            const exists = existingBookings.some(booking => booking.bookingNumber === bookingNumber);
            
            if (!exists) {
                isUnique = true;
            } else {
                attempts++;
                // Wait a moment before retry to avoid same timestamp
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } catch (error) {
            console.error('Error checking booking number uniqueness:', error);
            // Fallback to timestamp-based generation if database check fails
            const timestamp = Date.now().toString().slice(-6);
            bookingNumber = timestamp;
            isUnique = true;
        }
    }
    
    // Fallback if we couldn't generate unique number
    if (!isUnique) {
        const timestamp = Date.now().toString().slice(-6);
        bookingNumber = timestamp;
    }
    
    return bookingNumber;
}

// Function to automatically expire unpaid bookings after configured timeout
async function expireOldBookings() {
    try {
        const bookings = await loadBookings();
        const now = new Date();
        let expiredCount = 0;
        
        for (const booking of bookings) {
            // Only check pending bookings that have an expiration time
            if (booking.status === 'pending' && booking.expiresAt) {
                const expirationTime = new Date(booking.expiresAt);
                
                // If current time is past the expiration time, mark as expired
                if (now > expirationTime) {
                    console.log(`⏰ Expiring booking ${booking.bookingNumber} (created: ${booking.createdAt}, expires: ${booking.expiresAt})`);
                    await db.updateBooking(booking.id, { 
                        status: 'expired',
                        expiredAt: now.toISOString()
                    });
                    expiredCount++;
                }
            } else if (booking.status === 'pending' && booking.createdAt && !booking.expiresAt) {
                // Fallback for bookings without expiresAt field (legacy bookings)
                const createdTime = new Date(booking.createdAt);
                const paymentTimeoutMinutes = config.features && config.features.paymentTimeoutMinutes || 60;
                const hoursSinceCreated = (now - createdTime) / (1000 * 60 * 60); // Convert to hours
                
                // If more than configured timeout has passed, mark as expired
                if (hoursSinceCreated >= (paymentTimeoutMinutes / 60)) {
                    console.log(`⏰ Expiring legacy booking ${booking.bookingNumber} (created: ${booking.createdAt}, timeout: ${paymentTimeoutMinutes}min)`);
                    await db.updateBooking(booking.id, { 
                        status: 'expired',
                        expiredAt: now.toISOString(),
                        expiresAt: new Date(new Date(booking.createdAt).getTime() + (paymentTimeoutMinutes * 60 * 1000)).toISOString()
                    });
                    expiredCount++;
                }
            }
        }
        
        if (expiredCount > 0) {
            console.log(`⏰ Expired ${expiredCount} unpaid bookings past their timeout`);
        }
        
        return expiredCount;
    } catch (error) {
        console.error('Error expiring old bookings:', error);
        return 0;
    }
}

// Function to get available slots (excluding expired bookings)
async function getAvailableSlots(date) {
    await expireOldBookings(); // Clean up expired bookings first
    
    const bookings = await loadBookings();
    // Only consider confirmed and pending bookings as "booked"
    // Expired and declined bookings free up the slots
    const activeBookings = bookings.filter(booking => 
        booking.date === date && 
        (booking.status === 'confirmed' || booking.status === 'pending')
    );
    
    // Extract all booked slots from active bookings
    const bookedSlots = [];
    activeBookings.forEach(booking => {
        if (booking.bookedSlots) {
            // New format: slots stored as comma-separated string
            const slots = booking.bookedSlots.split(',');
            bookedSlots.push(...slots);
        } else {
            // Legacy format: single slot in time field
            bookedSlots.push(booking.time);
        }
    });
    
    return bookedSlots;
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

app.get('/booking-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/booking-success.html'));
});

app.get('/booking-success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/booking-success.html'));
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
        // Get booked slots (excluding expired bookings)
        const bookedSlots = await getAvailableSlots(date);
        
        const allSlots = getTimeSlots();
        const now = new Date();
        
        const availableSlots = allSlots.filter(slot => {
            if (bookedSlots.includes(slot)) return false;
            
            const [slotHour] = slot.split(':').map(Number);
            const [startHour] = config.openingHours.start.split(':').map(Number);
            const [endHour] = config.openingHours.end.split(':').map(Number);
            
            let slotDateTime = new Date(`${date}T${slot}:00`);
            
            // Handle cross-midnight bookings
            if (endHour <= startHour && slotHour < startHour) {
                slotDateTime.setDate(slotDateTime.getDate() + 1);
            }
            
            // Add 30-minute buffer for booking availability
            const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000));
            
            return slotDateTime > thirtyMinutesFromNow;
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
        
        // Check if booking time is in the past with proper timezone handling
        const now = new Date();
        
        // Parse the booking date and time properly
        let bookingDateTime = new Date(`${date}T${time}:00`);
        
        // Handle cross-midnight bookings (when end hour is less than start hour)
        const [startHour] = config.openingHours.start.split(':').map(Number);
        const [endHour] = config.openingHours.end.split(':').map(Number);
        const [bookingHour] = time.split(':').map(Number);
        
        // If venue operates past midnight and booking time is in the early morning hours
        if (endHour <= startHour && bookingHour < startHour) {
            // This booking is for the next day
            bookingDateTime.setDate(bookingDateTime.getDate() + 1);
        }
        
        // Add debug logging to see what's happening
        console.log('🕐 Time validation debug:', {
            now: now.toISOString(),
            nowLocal: now.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
            bookingDate: date,
            bookingTime: time,
            bookingDateTime: bookingDateTime.toISOString(),
            bookingDateTimeLocal: bookingDateTime.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
            comparison: bookingDateTime <= now ? 'PAST' : 'FUTURE',
            venueHours: `${config.openingHours.start} - ${config.openingHours.end}`,
            crossesMidnight: endHour <= startHour
        });
        
        // Allow booking if it's at least 30 minutes in the future
        const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000));
        
        if (bookingDateTime <= thirtyMinutesFromNow) {
            console.log('❌ Booking time is too close or in the past');
            console.log('❌ Booking DateTime:', bookingDateTime.toISOString());
            console.log('❌ Thirty Minutes From Now:', thirtyMinutesFromNow.toISOString());
            
            const currentTime = now.toLocaleString('ar-EG', { 
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const earliestBookingTime = thirtyMinutesFromNow.toLocaleString('ar-EG', { 
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return res.json({ 
                success: false, 
                message: `الوقت الحالي ${currentTime}. يجب أن يكون موعد الحجز بعد الساعة ${earliestBookingTime} على الأقل (30 دقيقة من الآن)` 
            });
        }
        
        const bookings = await loadBookings();
        
        // Expire old bookings first
        await expireOldBookings();
        
        // Get fresh bookings after expiration
        const currentBookings = await loadBookings();
        
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
        
        // Check if slots are available (only confirmed and pending bookings count)
        const activeBookings = currentBookings.filter(booking => 
            booking.date === date && 
            (booking.status === 'confirmed' || booking.status === 'pending')
        );
        
        // Get all booked slots for this date
        const bookedSlots = [];
        activeBookings.forEach(booking => {
            if (booking.bookedSlots) {
                // New format: slots stored as comma-separated string
                const slots = booking.bookedSlots.split(',');
                bookedSlots.push(...slots);
            } else {
                // Legacy format: single slot in time field
                bookedSlots.push(booking.time);
            }
        });
        
        // Check if any of our needed slots are already booked
        for (const slot of timeSlots) {
            if (bookedSlots.includes(slot)) {
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
        const bookingNumber = await generateBookingNumber();
        const requirePaymentConfirmation = config.features && config.features.requirePaymentConfirmation || false;
        const status = requirePaymentConfirmation ? 'pending' : 'confirmed';
        const totalPrice = config.pricePerHour * bookingHours;
        
        let allBookingDates = [date];
        
        // Handle recurring bookings
        if (isRecurring && recurringWeeks > 1) {
            const maxRecurringWeeks = config.features && config.features.maxRecurringWeeks || 16;
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
        
        // Create all booking entries - Store each week as separate entry for better admin control
        let bookingIndex = 0;
        const pricePerWeek = totalPrice; // Price per week (same for each occurrence)
        
        console.log(`💰 Price distribution: Total per week=${totalPrice}, Duration=${duration}min, Slots=${timeSlots.length}, Weeks=${allBookingDates.length}, Per week=${pricePerWeek}`);
        
        for (const bookingDate of allBookingDates) {
            // Calculate the actual end time by adding duration to start time
            const startTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
            const endTimeMinutes = startTimeMinutes + duration;
            const endHours = Math.floor(endTimeMinutes / 60) % 24;
            const endMins = endTimeMinutes % 60;
            const calculatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
            
            // Calculate which week this is in the recurring sequence
            const weekNumber = allBookingDates.indexOf(bookingDate) + 1;
            
            const booking = {
                id: `${bookingId}-${bookingIndex}`,
                groupId: bookingId, // Links all weeks together
                bookingNumber: bookingNumber, // Same confirmation number for all weeks
                name,
                phone,
                date: bookingDate,
                time: time, // Start time
                duration: duration,
                totalSlots: timeSlots.length,
                startTime: time,
                endTime: calculatedEndTime,
                bookedSlots: timeSlots.join(','), // Store all booked slots as comma-separated string
                createdAt: new Date().toISOString(),
                price: pricePerWeek, // Price for this specific week
                status: status, // Each week can have its own status
                expiresAt: requirePaymentConfirmation ? 
                    new Date(Date.now() + (config.features && config.features.paymentTimeoutMinutes || 60) * 60 * 1000).toISOString() : 
                    null,
                isRecurring: isRecurring,
                recurringWeeks: recurringWeeks,
                weekNumber: weekNumber, // Which week in the sequence (1, 2, 3, etc.)
                totalWeeks: allBookingDates.length, // Total number of weeks in this recurring booking
                recurringSequence: `${weekNumber}/${allBookingDates.length}`, // Display format: "2/4" means week 2 of 4
                allBookingDates: allBookingDates // Reference to all dates in this recurring booking
            };
            
            if (requirePaymentConfirmation) {
                booking.paymentInfo = config.paymentInfo;
            }
            
            await db.createBooking(booking);
            bookingIndex++;
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
        
        // For recurring bookings, show each week as separate entry
        // For non-recurring, keep as single entry
        const result = bookings.map(booking => {
            // Calculate proper time display
            let timeDisplay = booking.startTime || booking.time;
            if (booking.endTime && booking.endTime !== booking.startTime) {
                timeDisplay = `${booking.startTime || booking.time} - ${booking.endTime}`;
            }
            
            // For recurring bookings, add week information to the display
            let displayName = booking.name;
            let displayBookingNumber = booking.bookingNumber;
            
            if (booking.isRecurring && booking.weekNumber) {
                displayName = `${booking.name} (الأسبوع ${booking.weekNumber}/${booking.totalWeeks})`;
                displayBookingNumber = `${booking.bookingNumber}-W${booking.weekNumber}`;
            }
            
            return {
                id: booking.id,
                groupId: booking.groupId,
                bookingNumber: booking.bookingNumber, // Keep original booking number for operations
                displayBookingNumber: displayBookingNumber, // For display purposes
                name: booking.name,
                displayName: displayName, // Enhanced name with week info
                phone: booking.phone,
                date: booking.date,
                time: timeDisplay,
                startTime: booking.startTime || booking.time,
                endTime: booking.endTime,
                duration: booking.duration || 30,
                price: booking.price,
                status: booking.status,
                createdAt: booking.createdAt,
                expiresAt: booking.expiresAt,
                isRecurring: booking.isRecurring || false,
                recurringWeeks: booking.recurringWeeks || 1,
                weekNumber: booking.weekNumber || 1,
                totalWeeks: booking.totalWeeks || 1,
                recurringSequence: booking.recurringSequence || '1/1',
                // Additional info for display
                totalSlots: booking.totalSlots || 1
            };
        });
        
        // Sort by creation date (newest first), then by week number for recurring bookings
        result.sort((a, b) => {
            // First sort by creation date
            const dateComparison = new Date(b.createdAt) - new Date(a.createdAt);
            if (dateComparison !== 0) return dateComparison;
            
            // If same creation date (recurring bookings), sort by week number
            return (a.weekNumber || 1) - (b.weekNumber || 1);
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
    }
});

// Update booking status
app.post('/api/confirm-booking', async (req, res) => {
    try {
        const { bookingNumber, action, bookingId } = req.body;
        
        if (!bookingNumber || !action) {
            return res.json({ success: false, message: 'رقم الحجز والإجراء مطلوبان' });
        }
        
        const bookings = await loadBookings();
        
        let targetBookings = [];
        
        if (action === 'confirm') {
            // For confirmation: ALWAYS confirm all weeks in the recurring booking
            targetBookings = bookings.filter(b => b.bookingNumber === bookingNumber);
        } else if (action === 'decline') {
            // For decline: if bookingId is provided, decline only that specific week
            // if no bookingId, decline all weeks
            if (bookingId) {
                const specificBooking = bookings.find(b => b.id === bookingId);
                if (specificBooking) {
                    targetBookings = [specificBooking];
                }
            } else {
                targetBookings = bookings.filter(b => b.bookingNumber === bookingNumber);
            }
        }
        
        if (targetBookings.length === 0) {
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
        
        for (const booking of targetBookings) {
            await db.updateBooking(booking.id, updates);
        }
        
        let actionMessage = action === 'confirm' ? 'تأكيد' : 'رفض';
        let responseMessage = '';
        
        if (action === 'confirm' && targetBookings.length > 1) {
            // Confirming all weeks of recurring booking
            responseMessage = `تم ${actionMessage} جميع الأسابيع (${targetBookings.length}) للحجز المتكرر رقم ${bookingNumber} بنجاح`;
        } else if (action === 'decline' && targetBookings.length === 1 && targetBookings[0].isRecurring) {
            // Declining single week of recurring booking
            const booking = targetBookings[0];
            responseMessage = `تم ${actionMessage} الأسبوع ${booking.weekNumber}/${booking.totalWeeks} من الحجز رقم ${bookingNumber} بنجاح`;
        } else if (targetBookings.length > 1) {
            // Multiple weeks
            responseMessage = `تم ${actionMessage} ${targetBookings.length} من أسابيع الحجز رقم ${bookingNumber} بنجاح`;
        } else {
            // Single non-recurring booking
            responseMessage = `تم ${actionMessage} الحجز رقم ${bookingNumber} بنجاح`;
        }
        
        res.json({ success: true, message: responseMessage });
        
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
        
        console.log(`🔍 Check booking search: "${bookingNumber}" + "${name}" (${bookings.length} total bookings)`);
        
        // Search by either booking number OR phone number
        // Convert both to strings to ensure proper comparison
        const booking = bookings.find(b => {
            const bookingNumberMatch = String(b.bookingNumber) === String(bookingNumber);
            const phoneMatch = String(b.phone) === String(bookingNumber);
            const nameMatch = b.name.toLowerCase() === name.toLowerCase();
            
            return (bookingNumberMatch || phoneMatch) && nameMatch;
        });
        
        if (!booking) {
            console.log(`❌ No booking found for: "${bookingNumber}" + "${name}"`);
            return res.json({ success: false, message: 'لم يتم العثور على الحجز أو الاسم غير مطابق' });
        }
        
        console.log(`✅ Found booking: ${booking.bookingNumber} for ${booking.name}`);
        
        // Get all bookings with the same booking number (all weeks in recurring booking)
        const allRelatedBookings = bookings.filter(b => b.bookingNumber === booking.bookingNumber);
        
        // Calculate total price and prepare detailed information for each week
        const totalPrice = allRelatedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
        const bookingDates = [...new Set(allRelatedBookings.map(b => b.date))].sort();
        
        // Group by status for recurring bookings
        const statusSummary = {};
        allRelatedBookings.forEach(b => {
            const status = b.status || 'confirmed';
            if (!statusSummary[status]) {
                statusSummary[status] = 0;
            }
            statusSummary[status]++;
        });
        
        // Prepare detailed weeks information for recurring bookings
        const weeksInfo = allRelatedBookings.map(b => ({
            date: b.date,
            weekNumber: b.weekNumber || 1,
            status: b.status || 'confirmed',
            price: b.price || 0
        })).sort((a, b) => a.weekNumber - b.weekNumber);
        
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
            paymentInfo: booking.paymentInfo,
            // New fields for enhanced recurring booking support
            statusSummary: statusSummary,
            weeksInfo: weeksInfo,
            totalWeeks: allRelatedBookings.length
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

// Manual cleanup of expired bookings (admin only)
app.post('/api/admin/cleanup-expired', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    try {
        const expiredCount = await expireOldBookings();
        res.json({ 
            success: true, 
            message: `تم انتهاء صلاحية ${expiredCount} حجز غير مدفوع`,
            expiredCount: expiredCount
        });
    } catch (error) {
        console.error('Error in manual cleanup:', error);
        res.status(500).json({ error: 'خطأ في تنظيف الحجوزات المنتهية الصلاحية' });
    }
});

// Debug endpoint to check bookings (remove in production)
app.get('/api/debug/bookings', async (req, res) => {
    try {
        const bookings = await loadBookings();
        res.json({
            total: bookings.length,
            sample: bookings.slice(0, 5).map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                name: b.name,
                phone: b.phone,
                phoneType: typeof b.phone,
                date: b.date,
                status: b.status
            })),
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
    
    // Start automatic booking expiration cleanup (runs every 30 minutes)
    console.log('⏰ Starting automatic booking expiration cleanup...');
    setInterval(async () => {
        await expireOldBookings();
    }, 30 * 60 * 1000); // 30 minutes
    
    // Run initial cleanup
    expireOldBookings();
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
