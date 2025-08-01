// Global variables
let config = {};
let selectedTime = null;
let selectedDate = null;

// DOM elements
const bookingForm = document.getElementById('bookingForm');
const dateInput = document.getElementById('bookingDate');
const timeSlotsContainer = document.getElementById('timeSlots');
const submitBtn = document.getElementById('submitBtn');

// Modal elements
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();
    setupEventListeners();
    setMinDate();
    updateInfoPanel();
});

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        config = await response.json();
        
        // Update court name
        document.getElementById('courtName').textContent = config.courtName;
        document.title = `${config.courtName} - حجز ملعب كرة القدم`;
    } catch (error) {
        console.error('Error loading config:', error);
        showError('خطأ في تحميل إعدادات الموقع');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date change handler
    dateInput.addEventListener('change', handleDateChange);
    
    // Form submission
    bookingForm.addEventListener('submit', handleFormSubmit);
    
    // Modal close handlers
    setupModalHandlers();
}

// Set minimum date to today
function setMinDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.min = formattedDate;
    
    // Set max date to 30 days from now
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateInput.max = maxDate.toISOString().split('T')[0];
}

// Update info panel with config data
function updateInfoPanel() {
    if (!config.openingHours) return;
    
    document.getElementById('workingHours').textContent = 
        `${config.openingHours.start} - ${config.openingHours.end}`;
    
    document.getElementById('maxHours').textContent = 
        `${config.maxHoursPerPersonPerDay} ساعات يومياً`;
    
    document.getElementById('slotDuration').textContent = 
        `${config.slotDurationMinutes} دقيقة`;
    
    document.getElementById('priceInfo').textContent = 
        `${config.pricePerHour} ${config.currency}/ساعة`;
    
    // Update working days
    const dayNames = {
        'sunday': 'الأحد',
        'monday': 'الاثنين',
        'tuesday': 'الثلاثاء',
        'wednesday': 'الأربعاء',
        'thursday': 'الخميس',
        'friday': 'الجمعة',
        'saturday': 'السبت'
    };
    
    const workingDaysArabic = config.workingDays.map(day => dayNames[day]).join(' - ');
    document.getElementById('workingDays').textContent = workingDaysArabic;
}

// Handle date change
async function handleDateChange() {
    const date = dateInput.value;
    if (!date) return;
    
    selectedDate = date;
    selectedTime = null;
    submitBtn.disabled = true;
    
    await loadTimeSlots(date);
}

// Load available time slots for a date
async function loadTimeSlots(date) {
    try {
        timeSlotsContainer.innerHTML = '<p class="loading">جاري تحميل المواعيد...</p>';
        
        const response = await fetch(`/api/slots/${date}`);
        const data = await response.json();
        
        if (!data.available) {
            timeSlotsContainer.innerHTML = `<p class="loading">${data.message}</p>`;
            return;
        }
        
        if (data.slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="loading">لا توجد مواعيد متاحة في هذا اليوم</p>';
            return;
        }
        
        renderTimeSlots(data.slots, data.bookedSlots);
        
    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotsContainer.innerHTML = '<p class="loading">خطأ في تحميل المواعيد</p>';
    }
}

// Render time slots
// Check if a time slot is in the past
function isTimeSlotInPast(date, time) {
    const now = new Date();
    const slotDateTime = new Date(`${date}T${time}:00`);
    return slotDateTime <= now;
}

function renderTimeSlots(availableSlots, bookedSlots) {
    timeSlotsContainer.innerHTML = '';
    
    // Get all possible slots to show booked ones too
    const allSlots = generateAllTimeSlots();
    
    allSlots.forEach(time => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.textContent = time;
        
        // Check if time slot is in the past
        const isPastTime = isTimeSlotInPast(selectedDate, time);
        
        if (bookedSlots.includes(time)) {
            slotElement.classList.add('booked');
            slotElement.title = 'محجوز';
        } else if (isPastTime) {
            slotElement.classList.add('booked');
            slotElement.title = 'الوقت قد انتهى';
        } else if (availableSlots.includes(time)) {
            slotElement.addEventListener('click', () => selectTimeSlot(time, slotElement));
        } else {
            slotElement.classList.add('booked');
            slotElement.title = 'غير متاح';
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

// Generate all possible time slots based on config
function generateAllTimeSlots() {
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

// Select a time slot
function selectTimeSlot(time, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot
    element.classList.add('selected');
    selectedTime = time;
    
    // Enable submit button
    submitBtn.disabled = false;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!selectedTime || !selectedDate) {
        showError('يرجى اختيار التاريخ والوقت');
        return;
    }
    
    const formData = new FormData(bookingForm);
    const bookingData = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        date: selectedDate,
        time: selectedTime
    };
    
    // Validate form data
    if (!bookingData.name || !bookingData.phone) {
        showError('يرجى ملء جميع البيانات المطلوبة');
        return;
    }
    
    // Validate phone number (simple validation)
    if (!/^[0-9+\-\s()]{10,}$/.test(bookingData.phone)) {
        showError('يرجى إدخال رقم هاتف صحيح');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحجز...';
        
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`تم حجز موعدك بنجاح!
            
التاريخ: ${selectedDate}
الوقت: ${selectedTime}
السعر: ${result.booking.price} ${config.currency}

يرجى الوصول قبل الموعد بـ 10 دقائق.`);
            
            // Reset form
            bookingForm.reset();
            selectedTime = null;
            selectedDate = null;
            timeSlotsContainer.innerHTML = '<p class="loading">اختر التاريخ لعرض المواعيد المتاحة</p>';
            
        } else {
            showError(result.message || 'حدث خطأ أثناء الحجز');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'احجز الآن';
    }
}

// Show success modal
function showSuccess(message) {
    successMessage.textContent = message;
    successModal.classList.add('show');
}

// Show error modal
function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.add('show');
}

// Setup modal handlers
function setupModalHandlers() {
    // Success modal
    document.getElementById('closeModal').addEventListener('click', hideSuccessModal);
    document.getElementById('closeModalBtn').addEventListener('click', hideSuccessModal);
    
    // Error modal
    document.getElementById('closeErrorModal').addEventListener('click', hideErrorModal);
    document.getElementById('closeErrorModalBtn').addEventListener('click', hideErrorModal);
    
    // Close on backdrop click
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) hideSuccessModal();
    });
    
    errorModal.addEventListener('click', function(e) {
        if (e.target === errorModal) hideErrorModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideSuccessModal();
            hideErrorModal();
        }
    });
}

function hideSuccessModal() {
    successModal.classList.remove('show');
}

function hideErrorModal() {
    errorModal.classList.remove('show');
}

// Utility function to format date for display
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('ar-EG', options);
}

// Auto-refresh slots every 30 seconds if date is selected
setInterval(() => {
    if (selectedDate && !document.hidden) {
        loadTimeSlots(selectedDate);
    }
}, 30000);
