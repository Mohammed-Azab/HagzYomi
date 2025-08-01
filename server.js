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

// Default configuration
const config = {
    courtName: "ملعب كرة القدم",
    openingHours: {
        start: "08:00",
        end: "22:00"
    },
    workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    maxHoursPerPersonPerDay: 3,
    slotDurationMinutes: 60,
    currency: "جنيه",
    pricePerHour: 50,
    adminPassword: "admin123"
};

// Initialize data files for Railway persistent storage
const dataDir = './data';
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
    // Use file storage for Railway persistent storage
    try {
        return JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function saveBookings(bookings) {
    // Use file storage for Railway persistent storage
    fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
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
    
    // Filter out past times for today
    const availableSlots = allSlots.filter(slot => {
        if (bookedSlots.includes(slot)) return false;
        
        // Check if this time slot is in the past
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
    
    // Validation
    if (!name || !phone || !date || !time) {
        return res.json({ success: false, message: 'جميع البيانات مطلوبة' });
    }
    
    if (!isWorkingDay(date)) {
        return res.json({ success: false, message: 'لا يمكن الحجز في هذا اليوم' });
    }
    
    // Check if booking time is in the past
    const now = new Date();
    const bookingDateTime = new Date(`${date}T${time}:00`);
    
    if (bookingDateTime <= now) {
        return res.json({ success: false, message: 'لا يمكن الحجز في وقت سابق' });
    }
    
    const bookings = loadBookings();
    
    // Check if slot is already booked
    const existingBooking = bookings.find(booking => 
        booking.date === date && booking.time === time
    );
    
    if (existingBooking) {
        return res.json({ success: false, message: 'هذا الموعد محجوز بالفعل' });
    }
    
    // Check daily limit
    const userDailyHours = getUserBookingHours(phone, date);
    const slotHours = config.slotDurationMinutes / 60;
    
    if (userDailyHours + slotHours > config.maxHoursPerPersonPerDay) {
        return res.json({ 
            success: false, 
            message: `تجاوزت الحد الأقصى للحجز (${config.maxHoursPerPersonPerDay} ساعات يومياً)` 
        });
    }
    
    // Create booking
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

// Don't start the server in Vercel environment or when required as module
if (!process.env.VERCEL && require.main === module) {
    app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🚀 HagzYomi - Football Court Booking System');
        console.log('💻 Developed by: Mohammed Azab');
        console.log('📧 Contact: Mohammed@azab.io');
        console.log('© 2025 Mohammed Azab. All rights reserved.');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`🌐 Server running on http://localhost:${PORT}`);
        console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
        console.log(`🔑 Admin password: ${config.adminPassword}`);
        console.log('═══════════════════════════════════════════════════════');
    });
}

// Export the Express app for Vercel
module.exports = app;
