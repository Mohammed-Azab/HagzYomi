const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const app = express();

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

// In-memory storage for Vercel serverless
let bookingsMemory = [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'hagz-yomi-secret',
    resave: false,
    saveUninitialized: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Helper functions
function loadBookings() {
    return bookingsMemory;
}

function saveBookings(bookings) {
    bookingsMemory = bookings;
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

function isWorkingDay(date) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[new Date(date).getDay()];
    return config.workingDays.includes(dayName);
}

function getTimeSlots() {
    const slots = [];
    const [startHour, startMinute] = config.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = config.openingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    for (let time = startTime; time < endTime; time += config.slotDurationMinutes) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
    }
    
    return slots;
}

function getUserBookingHours(phone, date) {
    const bookings = loadBookings();
    return bookings
        .filter(booking => booking.phone === phone && booking.date === date)
        .reduce((total, booking) => total + (config.slotDurationMinutes / 60), 0);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        res.sendFile(path.join(__dirname, '..', 'public', 'admin-login.html'));
    } else {
        res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
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

app.get('/api/config', (req, res) => {
    res.json({
        courtName: config.courtName,
        openingHours: config.openingHours,
        workingDays: config.workingDays,
        maxHoursPerPersonPerDay: config.maxHoursPerPersonPerDay,
        slotDurationMinutes: config.slotDurationMinutes,
        currency: config.currency,
        pricePerHour: config.pricePerHour
    });
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
    
    const availableSlots = allSlots.filter(slot => {
        if (bookedSlots.includes(slot)) return false;
        const slotDateTime = new Date(`${date}T${slot}:00`);
        return slotDateTime > now;
    });
    
    res.json({
        available: true,
        slots: availableSlots,
        bookedSlots: bookedSlots
    });
});

app.post('/api/book', (req, res) => {
    const { name, phone, date, time } = req.body;
    
    if (!name || !phone || !date || !time) {
        return res.json({ success: false, message: 'جميع البيانات مطلوبة' });
    }
    
    if (!isWorkingDay(date)) {
        return res.json({ success: false, message: 'لا يمكن الحجز في هذا اليوم' });
    }
    
    const now = new Date();
    const bookingDateTime = new Date(`${date}T${time}:00`);
    
    if (bookingDateTime <= now) {
        return res.json({ success: false, message: 'لا يمكن الحجز في وقت سابق' });
    }
    
    const bookings = loadBookings();
    
    const existingBooking = bookings.find(booking => 
        booking.date === date && booking.time === time
    );
    
    if (existingBooking) {
        return res.json({ success: false, message: 'هذا الموعد محجوز بالفعل' });
    }
    
    const userDailyHours = getUserBookingHours(phone, date);
    const slotHours = config.slotDurationMinutes / 60;
    
    if (userDailyHours + slotHours > config.maxHoursPerPersonPerDay) {
        return res.json({ 
            success: false, 
            message: `تجاوزت الحد الأقصى للحجز (${config.maxHoursPerPersonPerDay} ساعات يومياً)` 
        });
    }
    
    const booking = {
        id: Date.now().toString(),
        name,
        phone,
        date,
        time,
        createdAt: new Date().toISOString(),
        price: config.pricePerHour * slotHours
    };
    
    bookings.push(booking);
    saveBookings(bookings);
    
    res.json({ success: true, booking });
});

app.get('/api/admin/bookings', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const bookings = loadBookings();
    res.json(bookings);
});

module.exports = app;
