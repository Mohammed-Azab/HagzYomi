/**
 * HagzYomi - Football Court Booking System
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @copyright 2025 Mohammed Azab. All rights reserved.
 * @description Complete Arabic football court booking website with admin panel
 */

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const app = express();
const PORT = process.env.PORT || 3000;

// Load configuration from config.json
let config;
try {
    const configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    config = JSON.parse(configFile);
    
    // Add admin password from environment or default
    config.adminPassword = process.env.ADMIN_PASSWORD;
    
    console.log('✅ Configuration loaded from config.json');
} catch (error) {
    console.error('❌ Error loading config.json:', error.message);
    
    // Fallback to default configuration
    config = {
        courtName: "ملعب كرة القدم",
        openingHours: {
            start: "08:00",
            end: "22:00"
        },
        workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        maxHoursPerPersonPerDay: 2,
        slotDurationMinutes: 30,
        currency: "جنيه",
        pricePerHour: 50,
        adminPassword: process.env.ADMIN_PASSWORD,
        contactInfo: {
            phone: "01234567890",
            address: "مركز شباب قرموط صهبرة",
            email: "info@example.com"
        },
        features: {
            enableOnlineBooking: true,
            requirePhoneVerification: false,
            allowCancellation: true,
            cancellationHours: 2
        },
        ui: {
            headerTitle: "مركز شباب قرموط صهبرة",
            headerSubtitle: "احجز ملعبك بسهولة",
            heroTitle: "ملعب حجز يومي",
            heroSubtitle: "احجز موعدك الآن واستمتع بلعب كرة القدم",
            primaryColor: "#2196F3",
            theme: "light"
        }
    };
    
    console.log('⚠️  Using fallback configuration');
}

// Initialize data files for Render persistent storage
const dataDir = process.env.RENDER_PERSISTENT_DISK_PATH ? 
    path.join(process.env.RENDER_PERSISTENT_DISK_PATH, 'data') : 
    './data';
const bookingsFile = path.join(dataDir, 'bookings.json');

// Create data directory and file if they don't exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

if (!fs.existsSync(bookingsFile)) {
    fs.writeFileSync(bookingsFile, JSON.stringify([]));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'hagz-yomi-secret',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from current directory
app.use(express.static(__dirname));

// Helper functions
function loadBookings() {
    // Use file storage for Render persistent storage
    try {
        const data = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
        return data.bookings || [];
    } catch (error) {
        return [];
    }
}

function saveBookings(bookings) {
    // Use file storage for Render persistent storage
    const data = { bookings: bookings };
    fs.writeFileSync(bookingsFile, JSON.stringify(data, null, 2));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    return new Date(d.setDate(diff));
}

function getWeekEnd(date) {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
}

function getMonthStart(yearMonth) {
    return new Date(yearMonth + '-01');
}

function getMonthEnd(yearMonth) {
    const start = getMonthStart(yearMonth);
    return new Date(start.getFullYear(), start.getMonth() + 1, 0);
}

function generateCSV(bookings, reportType, dateInfo) {
    let csvContent = '\ufeff'; // BOM for UTF-8
    csvContent += 'الاسم,رقم الهاتف,التاريخ,الوقت,السعر,وقت الحجز\n';
    
    bookings.forEach(booking => {
        csvContent += `${booking.name},${booking.phone},${booking.date},${booking.time},${booking.price},${booking.createdAt}\n`;
    });
    
    return csvContent;
}

function generateExcel(bookings, reportType, dateInfo) {
    const ws_data = [
        ['الاسم', 'رقم الهاتف', 'التاريخ', 'الوقت', 'السعر', 'وقت الحجز']
    ];
    
    bookings.forEach(booking => {
        ws_data.push([
            booking.name,
            booking.phone,
            booking.date,
            booking.time,
            booking.price + ' جنيه',
            booking.createdAt
        ]);
    });
    
    // Add summary row
    ws_data.push([]);
    ws_data.push(['إجمالي الحجوزات:', bookings.length]);
    ws_data.push(['إجمالي الإيرادات:', bookings.reduce((sum, b) => sum + b.price, 0) + ' جنيه']);
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الحجوزات');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function generatePDF(bookings, reportType, dateInfo) {
    console.log('Generating PDF for:', { reportType, bookingsCount: bookings.length, dateInfo });
    
    const doc = new jsPDF();
    
    // Add Arabic font support (simplified for this example)
    doc.setFont('helvetica');
    
    // Set text color to black
    doc.setTextColor(0, 0, 0);
    
    // Add title
    const title = `تقرير ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : reportType === 'monthly' ? 'شهري' : 'مخصص'}`;
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });
    
    // Add date info
    let dateText = '';
    if (reportType === 'daily') {
        dateText = `التاريخ: ${dateInfo.date}`;
    } else if (reportType === 'weekly') {
        dateText = `الأسبوع: ${dateInfo.weekStart} إلى ${dateInfo.weekEnd}`;
    } else if (reportType === 'monthly') {
        dateText = `الشهر: ${dateInfo.month}`;
    } else if (reportType === 'custom') {
        dateText = `من ${dateInfo.startDate} إلى ${dateInfo.endDate}`;
    }
    
    doc.setFontSize(12);
    doc.text(dateText, 105, 30, { align: 'center' });
    
    // Add summary
    doc.setFontSize(11);
    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    doc.text(`عدد الحجوزات: ${bookings.length}`, 20, 45);
    doc.text(`إجمالي الإيرادات: ${totalRevenue} جنيه`, 20, 55);
    
    // Add table
    const tableColumns = ['#', 'الاسم', 'رقم الهاتف', 'التاريخ', 'الوقت', 'السعر'];
    const tableRows = bookings.map((booking, index) => [
        (index + 1).toString(),
        booking.name || '',
        booking.phone || '',
        booking.date || '',
        booking.time || '',
        `${booking.price || 0} جنيه`
    ]);
    
    console.log('PDF table rows:', tableRows.length);
    
    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 2,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255]
        },
        headStyles: {
            fillColor: [33, 150, 243],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
            textColor: [0, 0, 0]
        },
        bodyStyles: {
            textColor: [0, 0, 0]
        }
    });
    
    const outputBuffer = doc.output('arraybuffer');
    console.log('PDF generated successfully, buffer size:', outputBuffer.byteLength);
    
    return outputBuffer;
}

function isWorkingDay(date) {
    const dayIndex = new Date(date).getDay();
    const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayName = arabicDays[dayIndex];
    return config.workingDays.includes(dayName);
}

function getTimeSlots() {
    const slots = [];
    const [startHour, startMinute] = config.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = config.openingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    let endTime = endHour * 60 + endMinute;
    
    // Handle overnight periods (e.g., 22:00 to 03:00)
    if (endTime <= startTime) {
        endTime += 24 * 60; // Add 24 hours to end time
    }
    
    for (let time = startTime; time < endTime; time += config.slotDurationMinutes) {
        const hours = Math.floor(time / 60) % 24; // Use modulo to handle 24+ hours
        const minutes = time % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
    }
    
    return slots;
}

function getUserBookingHours(phone, date) {
    const bookings = loadBookings();
    const userBookings = bookings.filter(booking => booking.phone === phone && booking.date === date);
    
    // Group bookings by groupId to avoid counting the same booking multiple times
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

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        res.sendFile(path.join(__dirname, 'admin-login.html'));
    } else {
        res.sendFile(path.join(__dirname, 'admin.html'));
    }
});

app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === config.adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'كلمة مرور خاطئة' });
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    res.json({ success: true });
});

app.get('/api/config', (req, res) => {
    res.json({
        courtName: config.courtName,
        openingHours: config.openingHours,
        workingDays: config.workingDays,
        maxHoursPerPersonPerDay: config.maxHoursPerPersonPerDay,
        slotDurationMinutes: config.slotDurationMinutes,
        maxBookingDaysAhead: config.maxBookingDaysAhead,
        currency: config.currency,
        pricePerHour: config.pricePerHour,
        contactInfo: config.contactInfo,
        features: config.features,
        ui: config.ui,
        requirePaymentConfirmation: config.features && config.features.requirePaymentConfirmation,
        paymentTimeoutMinutes: config.features && config.features.paymentTimeoutMinutes,
        paymentInfo: config.paymentInfo
    });
});

// Generate random booking number
function generateBookingNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HY${timestamp}${random}`;
}

// Check booking status endpoint
app.post('/api/check-booking', (req, res) => {
    try {
        const { bookingNumber, name } = req.body;
        
        if (!bookingNumber || !name) {
            return res.json({ success: false, message: 'رقم الحجز والاسم مطلوبان' });
        }
        
        const bookings = loadBookings();
        const booking = bookings.find(b => 
            b.bookingNumber === bookingNumber && 
            b.name.toLowerCase() === name.toLowerCase()
        );
        
        if (!booking) {
            return res.json({ success: false, message: 'لم يتم العثور على حجز بهذا الرقم والاسم' });
        }
        
        // Check if booking expired
        if (booking.status === 'pending' && booking.expiresAt) {
            const now = new Date();
            const expires = new Date(booking.expiresAt);
            if (now > expires) {
                booking.status = 'expired';
                // Save updated status
                saveBookings(bookings);
            }
        }
        
        // Add payment info if pending
        if (booking.status === 'pending') {
            booking.paymentInfo = config.paymentInfo;
        }
        
        res.json({ success: true, booking });
        
    } catch (error) {
        console.error('Check booking error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في النظام' });
    }
});

// Confirm booking payment endpoint (for admin)
app.post('/api/confirm-booking', (req, res) => {
    try {
        const { bookingNumber, action } = req.body; // action: 'confirm' or 'decline'
        
        if (!bookingNumber || !action) {
            return res.json({ success: false, message: 'رقم الحجز والإجراء مطلوبان' });
        }
        
        const bookings = loadBookings();
        const bookingIndex = bookings.findIndex(b => b.bookingNumber === bookingNumber);
        
        if (bookingIndex === -1) {
            return res.json({ success: false, message: 'لم يتم العثور على الحجز' });
        }
        
        const booking = bookings[bookingIndex];
        
        if (action === 'confirm') {
            booking.status = 'confirmed';
            booking.confirmedAt = new Date().toISOString();
        } else if (action === 'decline') {
            booking.status = 'declined';
            booking.declinedAt = new Date().toISOString();
        }
        
        
        saveBookings(bookings);
        
        res.json({ success: true, message: `تم ${action === 'confirm' ? 'تأكيد' : 'رفض'} الحجز بنجاح` });
        
    } catch (error) {
        console.error('Confirm booking error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في النظام' });
    }
});

// Admin endpoint to reload configuration
app.post('/api/admin/reload-config', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    try {
        const configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
        const newConfig = JSON.parse(configFile);
        
        // Preserve admin password
        newConfig.adminPassword = config.adminPassword;
        
        // Update global config
        config = newConfig;
        
        console.log('🔄 Configuration reloaded from config.json');
        res.json({ success: true, message: 'تم إعادة تحميل الإعدادات بنجاح' });
    } catch (error) {
        console.error('❌ Error reloading config:', error.message);
        res.status(500).json({ success: false, message: 'خطأ في إعادة تحميل الإعدادات' });
    }
});

app.get('/api/slots/:date', (req, res) => {
    const { date } = req.params;
    
    if (!isWorkingDay(date)) {
        return res.json({ available: false, message: 'يوم إجازة' });
    }
    
    const bookings = loadBookings();
    const bookedSlots = bookings
        .filter(booking => booking.date === date)
        .map(booking => booking.time);
    
    const allSlots = getTimeSlots();
    const now = new Date();
    
    // Filter out past times for today
    const availableSlots = allSlots.filter(slot => {
        if (bookedSlots.includes(slot)) return false;
        
        // Check if this time slot is in the past
        const [slotHour] = slot.split(':').map(Number);
        const [startHour] = config.openingHours.start.split(':').map(Number);
        const [endHour] = config.openingHours.end.split(':').map(Number);
        
        let slotDateTime = new Date(`${date}T${slot}:00`);
        
        // For overnight periods, times like 00:00-03:00 are considered next day
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
});

app.post('/api/book', (req, res) => {
    const { name, phone, date, time, duration = 30, isRecurring = false, recurringWeeks = 1 } = req.body;
    
    // Validation
    if (!name || !phone || !date || !time) {
        return res.json({ success: false, message: 'جميع البيانات مطلوبة' });
    }
    
    if (!isWorkingDay(date)) {
        return res.json({ success: false, message: 'لا يمكن الحجز في هذا اليوم' });
    }
    
    // Validate duration (30, 60, 90, or 120 minutes)
    if (![30, 60, 90, 120].includes(duration)) {
        return res.json({ success: false, message: 'مدة الحجز غير صحيحة' });
    }
    
    // Check if booking time is in the past
    const now = new Date();
    const [timeHour] = time.split(':').map(Number);
    const [configStartHour] = config.openingHours.start.split(':').map(Number);
    const [configEndHour] = config.openingHours.end.split(':').map(Number);
    
    let bookingDateTime = new Date(`${date}T${time}:00`);
    
    // For overnight periods, times like 00:00-03:00 are considered next day
    if (configEndHour <= configStartHour && timeHour < configStartHour) {
        bookingDateTime.setDate(bookingDateTime.getDate() + 1);
    }
    
    if (bookingDateTime <= now) {
        return res.json({ success: false, message: 'لا يمكن الحجز في وقت سابق' });
    }
    
    const bookings = loadBookings();
    
    // Generate all time slots that will be booked
    const timeSlots = [];
    const allSlots = getTimeSlots();
    const startIndex = allSlots.indexOf(time);
    
    if (startIndex === -1) {
        return res.json({ success: false, message: 'وقت غير صحيح' });
    }
    
    const slotsNeeded = duration / config.slotDurationMinutes;
    
    // Check if we have enough consecutive slots available
    if (startIndex + slotsNeeded > allSlots.length) {
        return res.json({ success: false, message: 'لا توجد مواعيد كافية متتالية' });
    }
    
    for (let i = 0; i < slotsNeeded; i++) {
        timeSlots.push(allSlots[startIndex + i]);
    }
    
    // Check if any of the required slots are already booked
    for (const slot of timeSlots) {
        const existingBooking = bookings.find(booking => 
            booking.date === date && booking.time === slot
        );
        
        if (existingBooking) {
            return res.json({ success: false, message: `الموعد ${slot} محجوز بالفعل` });
        }
    }
    
    // Check daily limit
    const userDailyHours = getUserBookingHours(phone, date);
    const bookingHours = duration / 60;
    
    if (userDailyHours + bookingHours > config.maxHoursPerPersonPerDay) {
        return res.json({ 
            success: false, 
            message: `تجاوزت الحد الأقصى للحجز (${config.maxHoursPerPersonPerDay} ساعات يومياً)` 
        });
    }
    
    // Handle recurring bookings
    let allBookingDates = [date];
    let totalPrice = config.pricePerHour * bookingHours;
    
    if (isRecurring && recurringWeeks > 1) {
        // Validate recurring weeks
        const maxRecurringWeeks = (config.features && config.features.maxRecurringWeeks) || 8;
        if (recurringWeeks > maxRecurringWeeks) {
            return res.json({ 
                success: false, 
                message: `الحد الأقصى للحجز المتكرر هو ${maxRecurringWeeks} أسابيع` 
            });
        }
        
        // Generate all recurring dates
        for (let week = 1; week < recurringWeeks; week++) {
            const recurringDate = new Date(date);
            recurringDate.setDate(recurringDate.getDate() + (week * 7));
            const recurringDateStr = recurringDate.toISOString().split('T')[0];
            
            // Check if recurring date is a working day
            if (!isWorkingDay(recurringDateStr)) {
                return res.json({ 
                    success: false, 
                    message: `التاريخ ${recurringDateStr} ليس يوم عمل` 
                });
            }
            
            // Check if any of the required slots are already booked on recurring dates
            for (const slot of timeSlots) {
                const existingBooking = bookings.find(booking => 
                    booking.date === recurringDateStr && booking.time === slot
                );
                
                if (existingBooking) {
                    return res.json({ 
                        success: false, 
                        message: `الموعد ${slot} في تاريخ ${recurringDateStr} محجوز بالفعل` 
                    });
                }
            }
            
            allBookingDates.push(recurringDateStr);
        }
        
        totalPrice = totalPrice * recurringWeeks;
    }
    
    // Create bookings for all time slots and all dates
    const bookingId = Date.now().toString();
    const bookingNumber = generateBookingNumber();
    
    // Use global configuration
    const requirePaymentConfirmation = (config.features && config.features.requirePaymentConfirmation) || false;
    
    // Set booking status and expiration
    const status = requirePaymentConfirmation ? 'pending' : 'confirmed';
    const expiresAt = requirePaymentConfirmation ? 
        new Date(Date.now() + ((config.features && config.features.paymentTimeoutMinutes) || 60) * 60 * 1000).toISOString() : 
        null;
    
    const allNewBookings = [];
    let bookingIndex = 0;
    
    // Create bookings for each date
    for (const bookingDate of allBookingDates) {
        const newBookings = timeSlots.map((slot, slotIndex) => {
            const booking = {
                id: `${bookingId}-${bookingIndex}`,
                groupId: bookingId,
                bookingNumber: bookingNumber,
                name,
                phone,
                date: bookingDate,
                time: slot,
                duration: duration,
                totalSlots: timeSlots.length,
                slotIndex: slotIndex,
                startTime: time,
                endTime: timeSlots[timeSlots.length - 1],
                createdAt: new Date().toISOString(),
                price: (bookingIndex === 0 && slotIndex === 0) ? totalPrice : 0, // Only charge once for the entire group
                status: status,
                expiresAt: expiresAt,
                isRecurring: isRecurring,
                recurringWeeks: recurringWeeks,
                bookingDates: allBookingDates
            };
            
            // Add payment information if payment confirmation is required
            if (requirePaymentConfirmation) {
                booking.paymentInfo = config.paymentInfo;
            }
            
            return booking;
        });
        
        allNewBookings.push(...newBookings);
        bookingIndex += timeSlots.length;
    }
    
    // Calculate proper end time by adding slot duration to the last slot
    const endTimeSlot = timeSlots[timeSlots.length - 1];
    const [endHour, endMinute] = endTimeSlot.split(':').map(Number);
    const endTimeMinutes = endHour * 60 + endMinute + config.slotDurationMinutes;
    const finalEndHour = Math.floor(endTimeMinutes / 60);
    const finalEndMinute = endTimeMinutes % 60;
    const finalEndTime = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
    
    bookings.push(...allNewBookings);
    saveBookings(bookings);
    
    // Prepare response with payment info if needed
    const response = { 
        success: true, 
        booking: {
            id: bookingId,
            bookingNumber: bookingNumber,
            name,
            phone,
            date,
            startTime: time,
            endTime: finalEndTime,
            duration,
            price: totalPrice,
            status: status,
            slots: timeSlots,
            isRecurring: isRecurring,
            recurringWeeks: recurringWeeks,
            bookingDates: allBookingDates
        }
    };
    
    // Add payment information if payment confirmation is required
    if (requirePaymentConfirmation) {
        response.booking.paymentInfo = config.paymentInfo;
        response.booking.expiresAt = expiresAt;
        response.booking.paymentRequired = true;
        response.message = `تم إنشاء الحجز برقم ${bookingNumber}. يرجى الدفع خلال ${(config.features && config.features.paymentTimeoutMinutes) || 60} دقيقة لتأكيد الحجز.`;
    } else {
        response.message = `تم تأكيد الحجز برقم ${bookingNumber} بنجاح!`;
    }
    
    res.json(response);
});

app.get('/api/admin/bookings', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const bookings = loadBookings();
    res.json(bookings);
});

app.get('/api/admin/report/:date', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const { date } = req.params;
    const bookings = loadBookings().filter(booking => booking.date === date);
    
    let csvContent = 'الاسم,رقم الهاتف,التاريخ,الوقت,السعر,وقت الحجز\n';
    bookings.forEach(booking => {
        csvContent += `${booking.name},${booking.phone},${booking.date},${booking.time},${booking.price},${booking.createdAt}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report_${date}.csv"`);
    res.send('\ufeff' + csvContent); // BOM for UTF-8
});

app.get('/api/admin/report', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const { format, type, date, weekDate, month, startDate, endDate } = req.query;
    
    if (!format || !type) {
        return res.status(400).json({ error: 'معاملات مفقودة' });
    }
    
    let filteredBookings = [];
    let dateInfo = {};
    const allBookings = loadBookings();
    
    try {
        // Filter bookings based on report type
        switch(type) {
            case 'daily':
                if (!date) {
                    return res.status(400).json({ error: 'التاريخ مطلوب' });
                }
                filteredBookings = allBookings.filter(booking => booking.date === date);
                dateInfo = { date };
                break;
                
            case 'weekly':
                if (!weekDate) {
                    return res.status(400).json({ error: 'تاريخ الأسبوع مطلوب' });
                }
                const weekStart = getWeekStart(new Date(weekDate));
                const weekEnd = getWeekEnd(new Date(weekDate));
                filteredBookings = allBookings.filter(booking => {
                    const bookingDate = new Date(booking.date);
                    return bookingDate >= weekStart && bookingDate <= weekEnd;
                });
                dateInfo = { weekStart: formatDate(weekStart), weekEnd: formatDate(weekEnd) };
                break;
                
            case 'monthly':
                if (!month) {
                    return res.status(400).json({ error: 'الشهر مطلوب' });
                }
                const monthStart = getMonthStart(month);
                const monthEnd = getMonthEnd(month);
                filteredBookings = allBookings.filter(booking => {
                    const bookingDate = new Date(booking.date);
                    return bookingDate >= monthStart && bookingDate <= monthEnd;
                });
                dateInfo = { month };
                break;
                
            case 'custom':
                if (!startDate || !endDate) {
                    return res.status(400).json({ error: 'تاريخ البداية والنهاية مطلوبان' });
                }
                filteredBookings = allBookings.filter(booking => {
                    const bookingDate = new Date(booking.date);
                    return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
                });
                dateInfo = { startDate, endDate };
                break;
                
            default:
                return res.status(400).json({ error: 'نوع تقرير غير صحيح' });
        }
        
        // Generate report based on format
        let fileContent, contentType, extension;
        
        switch(format) {
            case 'csv':
                fileContent = generateCSV(filteredBookings, type, dateInfo);
                contentType = 'text/csv; charset=utf-8';
                extension = 'csv';
                break;
                
            case 'excel':
                fileContent = generateExcel(filteredBookings, type, dateInfo);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                extension = 'xlsx';
                break;
                
            case 'pdf':
                const pdfArrayBuffer = generatePDF(filteredBookings, type, dateInfo);
                fileContent = Buffer.from(pdfArrayBuffer);
                contentType = 'application/pdf';
                extension = 'pdf';
                break;
                
            default:
                return res.status(400).json({ error: 'صيغة ملف غير صحيحة' });
        }
        
        // Generate filename
        const dateStr = type === 'daily' ? date : 
                       type === 'weekly' ? `week_${weekDate}` :
                       type === 'monthly' ? `month_${month}` :
                       `${startDate}_to_${endDate}`;
        
        const filename = `report_${type}_${dateStr}.${extension}`;
        
        console.log('Sending response:', {
            filename,
            contentType,
            bufferSize: fileContent ? fileContent.length || fileContent.byteLength : 'undefined'
        });
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(fileContent);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'خطأ في إنشاء التقرير' });
    }
});

app.delete('/api/admin/booking/:id', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const { id } = req.params;
    const bookings = loadBookings();
    const filteredBookings = bookings.filter(booking => booking.id !== id);
    
    if (filteredBookings.length === bookings.length) {
        return res.json({ success: false, message: 'الحجز غير موجود' });
    }
    
    saveBookings(filteredBookings);
    res.json({ success: true });
});

// Start the server for Render deployment
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 HagzYomi - Football Court Booking System');
    console.log('💻 Developed by: Mohammed Azab');
    console.log('📧 Contact: Mohammed@azab.io');
    console.log('© 2025 Mohammed Azab. All rights reserved.');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📊 Admin panel available at /admin`);
    console.log(`🔑 Admin password: ${config.adminPassword}`);
    console.log('🎯 Render deployment ready! 🌟');
    console.log('═══════════════════════════════════════════════════════');
});

// Export the Express app for compatibility
module.exports = app;
