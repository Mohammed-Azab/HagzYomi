// GitHub Pages Compatible Booking System with Firebase
// Uses Firestore for shared cloud database

// Configuration
const CONFIG = {
    courtName: "ملعب كرة القدم",
    openingHours: { start: "08:00", end: "22:00" },
    workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    maxHoursPerPersonPerDay: 3,
    slotDurationMinutes: 60,
    currency: "ريال",
    pricePerHour: 50,
    adminPassword: "admin123"
};

// Firestore Database functions
async function getBookings() {
    try {
        const snapshot = await bookingsCollection.get();
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        return bookings;
    } catch (error) {
        console.error('Error getting bookings:', error);
        return [];
    }
}

async function saveBooking(bookingData) {
    try {
        const docRef = await bookingsCollection.add({
            ...bookingData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, ...bookingData };
    } catch (error) {
        console.error('Error saving booking:', error);
        throw error;
    }
}

async function deleteBooking(bookingId) {
    try {
        await bookingsCollection.doc(bookingId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting booking:', error);
        throw error;
    }
}

// Generate time slots
function generateTimeSlots() {
    const slots = [];
    const [startHour, startMinute] = CONFIG.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = CONFIG.openingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    for (let time = startTime; time < endTime; time += CONFIG.slotDurationMinutes) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
    }
    
    return slots;
}

// Check if date is valid (not in the past and within working days)
function isValidDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayName = dayNames[date.getDay()];
    
    return CONFIG.workingDays.includes(dayName);
}

// Get available slots for a date
async function getAvailableSlots(date) {
    const bookings = await getBookings();
    const dayBookings = bookings.filter(b => b.date === date);
    const bookedTimes = dayBookings.map(b => b.time);
    
    const allSlots = generateTimeSlots();
    return allSlots.filter(slot => !bookedTimes.includes(slot));
}

// Calculate user's daily hours
async function getUserDailyHours(phone, date) {
    const bookings = await getBookings();
    return bookings
        .filter(b => b.customerPhone === phone && b.date === date)
        .reduce((total, booking) => total + (CONFIG.slotDurationMinutes / 60), 0);
}

// Show loading indicator
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

// Hide loading indicator
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

// Format Arabic date
function formatArabicDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        calendar: 'islamic-umalqura'
    };
    
    try {
        return date.toLocaleDateString('ar-SA', options);
    } catch (e) {
        return date.toLocaleDateString('ar-SA');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('timeSlot');
    const slotsDisplay = document.getElementById('slotsDisplay');
    
    // Set minimum date to today
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    
    // Set maximum date to 30 days from now
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Handle date change
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        
        showLoading();
        
        if (!isValidDate(selectedDate)) {
            showError('التاريخ المحدد غير متاح للحجز');
            this.value = '';
            timeSelect.innerHTML = '<option value="">اختر الوقت</option>';
            slotsDisplay.style.display = 'none';
            hideLoading();
            return;
        }
        
        try {
            const availableSlots = await getAvailableSlots(selectedDate);
            
            // Update time select
            timeSelect.innerHTML = '<option value="">اختر الوقت</option>';
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            });
            
            // Show available slots
            displayAvailableSlots(availableSlots);
        } catch (error) {
            console.error('Error loading slots:', error);
            showError('خطأ في تحميل المواعيد المتاحة');
        }
        
        hideLoading();
    });
    
    // Handle form submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">جاري الحجز...</span><span class="btn-icon">⏳</span>';
        
        showLoading();
        
        const formData = new FormData(this);
        const bookingData = {
            customerName: formData.get('customerName').trim(),
            customerPhone: formData.get('customerPhone').trim(),
            date: formData.get('bookingDate'),
            time: formData.get('timeSlot')
        };
        
        try {
            // Validate form data
            if (!bookingData.customerName || !bookingData.customerPhone || !bookingData.date || !bookingData.time) {
                showError('يرجى ملء جميع الحقول');
                return;
            }
            
            // Validate phone number
            const phonePattern = /^05[0-9]{8}$/;
            if (!phonePattern.test(bookingData.customerPhone)) {
                showError('رقم الهاتف يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام');
                return;
            }
            
            // Check if date is valid
            if (!isValidDate(bookingData.date)) {
                showError('التاريخ المحدد غير متاح للحجز');
                return;
            }
            
            // Check daily limit
            const userDailyHours = await getUserDailyHours(bookingData.customerPhone, bookingData.date);
            const slotHours = CONFIG.slotDurationMinutes / 60;
            
            if (userDailyHours + slotHours > CONFIG.maxHoursPerPersonPerDay) {
                showError(`تجاوزت الحد الأقصى للحجز (${CONFIG.maxHoursPerPersonPerDay} ساعات يومياً)`);
                return;
            }
            
            // Check if slot is still available
            const availableSlots = await getAvailableSlots(bookingData.date);
            if (!availableSlots.includes(bookingData.time)) {
                showError('هذا الموعد محجوز بالفعل');
                return;
            }
            
            // Create booking
            const booking = {
                ...bookingData,
                price: CONFIG.pricePerHour * slotHours
            };
            
            // Save booking to Firestore
            const savedBooking = await saveBooking(booking);
            
            // Show success
            showSuccess(savedBooking);
            
            // Reset form
            this.reset();
            timeSelect.innerHTML = '<option value="">اختر الوقت</option>';
            slotsDisplay.style.display = 'none';
            
        } catch (error) {
            console.error('Error creating booking:', error);
            showError('خطأ في إنشاء الحجز. يرجى المحاولة مرة أخرى.');
        } finally {
            hideLoading();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">احجز الآن</span><span class="btn-icon">⚽</span>';
        }
    });
    
    // Modal functionality
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Display available slots
function displayAvailableSlots(slots) {
    const slotsDisplay = document.getElementById('slotsDisplay');
    const availableSlots = document.getElementById('availableSlots');
    
    if (slots.length === 0) {
        availableSlots.innerHTML = '<p class="no-slots">لا توجد مواعيد متاحة في هذا التاريخ</p>';
    } else {
        availableSlots.innerHTML = slots.map(slot => 
            `<div class="slot-item available">${slot}</div>`
        ).join('');
    }
    
    slotsDisplay.style.display = 'block';
}

// Show success modal
function showSuccess(booking) {
    const modal = document.getElementById('successModal');
    const details = document.getElementById('bookingDetails');
    
    const arabicDate = formatArabicDate(booking.date);
    
    details.innerHTML = `
        <strong>تفاصيل الحجز:</strong><br>
        الاسم: ${booking.customerName}<br>
        الهاتف: ${booking.customerPhone}<br>
        التاريخ: ${arabicDate}<br>
        الوقت: ${booking.time}<br>
        السعر: ${booking.price} ${CONFIG.currency}
    `;
    
    modal.style.display = 'block';
}

// Show error modal
function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    modal.style.display = 'block';
}
