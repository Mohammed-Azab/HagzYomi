/**
 * HagzYomi - Football Court Booking System Frontend
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @copyright 2025 Mohammed Azab. All rights reserved.
 * @description JavaScript functionality for the football court booking system
 */

// Global variables
let config = {};
let selectedDate = null;
let selectedTime = null;
let countdownInterval = null; // Add global countdown control

// DOM elements
const bookingForm = document.getElementById('bookingForm');
const dateInput = document.getElementById('bookingDate');
const durationSelect = document.getElementById('bookingDuration');
const timeSlotsContainer = document.getElementById('timeSlots');
const submitBtn = document.getElementById('submitBtn');

// Recurring booking elements
const recurringSection = document.getElementById('recurringSection');
const enableRecurringCheckbox = document.getElementById('enableRecurring');
const recurringOptions = document.getElementById('recurringOptions');
const recurringWeeksSelect = document.getElementById('recurringWeeks');

// Modal elements
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();
    setupEventListeners();
    setMinDate(); // Call after config is loaded
    updateInfoPanel();
});

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        config = await response.json();
        
        // Update court name and page title
        document.getElementById('courtName').textContent = config.courtName;
        document.title = `${config.courtName} - حجز ملعب كرة القدم`;
        
        // Update header title
        const logoTitle = document.querySelector('.logo h1');
        if (logoTitle) {
            logoTitle.textContent = `⚽ ${config.ui?.headerTitle || config.courtName}`;
        }
        
        // Update CSS variables if UI config is provided
        updateCSSVariables();
        
        // Update hero section content
        updateHeroContent();
        
        // Update UI elements if available
        if (config.ui) {
            // Update header
            const headerTitle = document.querySelector('.logo h1');
            const headerSubtitle = document.querySelector('.logo p');
            const heroTitle = document.getElementById('courtName');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            
            if (headerTitle && config.ui.headerTitle) {
                headerTitle.textContent = `⚽ ${config.ui.headerTitle}`;
            }
            if (headerSubtitle && config.ui.headerSubtitle) {
                headerSubtitle.textContent = config.ui.headerSubtitle;
            }
            if (heroTitle && config.ui.heroTitle) {
                heroTitle.textContent = config.ui.heroTitle;
            }
            if (heroSubtitle && config.ui.heroSubtitle) {
                heroSubtitle.textContent = config.ui.heroSubtitle;
            }
            
            // Update primary color if specified
            if (config.ui.primaryColor) {
                document.documentElement.style.setProperty('--primary-color', config.ui.primaryColor);
            }
        }
        
        // Show recurring booking section if enabled
        if (config.features && config.features.enableRecurringBooking) {
            recurringSection.style.display = 'block';
            
            // Update max weeks based on config
            const maxWeeks = Math.min(
                config.features.maxRecurringWeeks || 8,
                Math.floor(config.maxBookingDaysAhead / 7)
            );
            
            // Update recurring weeks options
            recurringWeeksSelect.innerHTML = '';
            for (let i = 2; i <= maxWeeks; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i === 4 ? 'شهر (4 أسابيع)' : 
                                   i === 8 ? 'شهرين (8 أسابيع)' : 
                                   `${i} أسابيع`;
                recurringWeeksSelect.appendChild(option);
            }
        }
        
    } catch (error) {
        console.error('Error loading config:', error);
        showError('خطأ في تحميل إعدادات الموقع');
    }
}

// Update CSS variables based on config
function updateCSSVariables() {
    if (config.ui && config.ui.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', config.ui.primaryColor);
        document.documentElement.style.setProperty('--accent-color', config.ui.primaryColor);
    }
}

// Update hero section content
function updateHeroContent() {
    const heroTitle = document.getElementById('courtName');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle && config.ui?.heroTitle) {
        heroTitle.textContent = config.ui.heroTitle;
    } else if (heroTitle && config.courtName) {
        heroTitle.textContent = config.courtName;
    }
    
    if (heroSubtitle && config.ui?.heroSubtitle) {
        heroSubtitle.textContent = config.ui.heroSubtitle;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date change handler
    dateInput.addEventListener('change', handleDateChange);
    
    // Duration change handler
    durationSelect.addEventListener('change', handleDurationChange);
    
    // Form submission
    bookingForm.addEventListener('submit', handleFormSubmit);
    
    // Recurring booking handlers
    enableRecurringCheckbox.addEventListener('change', handleRecurringToggle);
    
    // Modal close handlers
    setupModalHandlers();
    
    // InstaPay click handler for main page
    setupInstaPayHandler();
}

// Setup InstaPay click handler for main page
function setupInstaPayHandler() {
    const instaPayMethod = document.getElementById('instaPayMethod');
    if (instaPayMethod) {
        instaPayMethod.addEventListener('click', function() {
            if (config.paymentInfo?.instaPayLink) {
                window.open(config.paymentInfo.instaPayLink, '_blank');
            } else {
                // Fallback if link is not available
                alert('سيتم توجيهك لصفحة الدفع قريباً');
            }
        });
    }
}

// Handle recurring booking toggle
function handleRecurringToggle() {
    if (enableRecurringCheckbox.checked) {
        recurringOptions.style.display = 'block';
    } else {
        recurringOptions.style.display = 'none';
    }
}

// Set minimum date to today
function setMinDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.min = formattedDate;
    
    // Set max date based on config (default to 60 days if not specified)
    const maxDaysAhead = config.maxBookingDaysAhead || 60;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDaysAhead);
    dateInput.max = maxDate.toISOString().split('T')[0];
}

// Convert 24-hour time to 12-hour format with Arabic AM/PM
function formatTimeToArabic12Hour(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    let hour12 = hours;
    let period = '';
    
    if (hours === 0) {
        hour12 = 12;
        period = 'منتصف الليل';
    } else if (hours < 12) {
        hour12 = hours;
        period = 'صباحاً';
    } else if (hours === 12) {
        hour12 = 12;
        period = 'ظهراً';
    } else {
        hour12 = hours - 12;
        period = 'مساءً';
    }
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Update info panel with config data
function updateInfoPanel() {
    if (!config.openingHours) return;
    
    // Format operating hours with AM/PM
    const startTime12 = formatTimeToArabic12Hour(config.openingHours.start);
    const endTime12 = formatTimeToArabic12Hour(config.openingHours.end);
    
    // Check if it's an overnight period
    const [startHour] = config.openingHours.start.split(':').map(Number);
    const [endHour] = config.openingHours.end.split(':').map(Number);
    const isOvernight = endHour < startHour;
    
    let workingHoursText;
    if (isOvernight) {
        workingHoursText = `${startTime12} - ${endTime12} (اليوم التالي)`;
    } else {
        workingHoursText = `${startTime12} - ${endTime12}`;
    }
    
    document.getElementById('workingHours').textContent = workingHoursText;
    
    document.getElementById('maxHours').textContent = 
        `${config.maxHoursPerPersonPerDay} ساعة يومياً`;
    
    document.getElementById('slotDuration').textContent = 
        `${config.slotDurationMinutes} دقيقة (الحد الأدنى)`;
    
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
    
    // Check if all 7 days are present
    if (config.workingDays.length === 7) {
        document.getElementById('workingDays').textContent = 'جميع أيام الأسبوع';
    } else {
        // Check if workingDays are already in Arabic
        const isArabic = config.workingDays.some(day => Object.values(dayNames).includes(day));
        
        let workingDaysArabic;
        if (isArabic) {
            // Already in Arabic, just join them
            workingDaysArabic = config.workingDays.join(' - ');
        } else {
            // Convert from English to Arabic
            workingDaysArabic = config.workingDays.map(day => dayNames[day]).join(' - ');
        }
        
        document.getElementById('workingDays').textContent = workingDaysArabic;
    }
    
    // Update payment details if available
    if (config.paymentInfo) {
        const vodafoneCashElement = document.getElementById('vodafoneCash');
        const instaPayElement = document.getElementById('instaPay');
        const paymentInstructionsElement = document.getElementById('paymentInstructions');
        const paymentTimeoutElement = document.getElementById('paymentTimeout');
        
        if (vodafoneCashElement && config.paymentInfo.vodafoneCash) {
            vodafoneCashElement.textContent = config.paymentInfo.vodafoneCash;
        }
        
        if (instaPayElement && config.paymentInfo.instaPay) {
            instaPayElement.textContent = config.paymentInfo.instaPay;
        }
        
        if (paymentInstructionsElement && config.paymentInfo.instructions) {
            paymentInstructionsElement.textContent = config.paymentInfo.instructions;
        }
        
        if (paymentTimeoutElement && config.paymentTimeoutMinutes) {
            paymentTimeoutElement.textContent = config.paymentTimeoutMinutes;
        }
    }
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

// Handle duration change
async function handleDurationChange() {
    if (selectedDate) {
        selectedTime = null;
        submitBtn.disabled = true;
        await loadTimeSlots(selectedDate);
    }
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
    const [hours, minutes] = time.split(':').map(Number);
    
    // For overnight periods, times like 00:00-03:00 are considered next day
    const [startHour] = config.openingHours.start.split(':').map(Number);
    const [endHour] = config.openingHours.end.split(':').map(Number);
    
    let slotDateTime = new Date(`${date}T${time}:00`);
    
    // If this is an overnight period and the current time is before start hour
    if (endHour <= startHour && hours < startHour) {
        // Add one day to the slot time
        slotDateTime.setDate(slotDateTime.getDate() + 1);
    }
    
    return slotDateTime <= now;
}

function renderTimeSlots(availableSlots, bookedSlots) {
    timeSlotsContainer.innerHTML = '';
    
    // Get all possible slots to show booked ones too
    const allSlots = generateAllTimeSlots();
    const selectedDuration = parseInt(durationSelect.value);
    const slotsNeeded = selectedDuration / config.slotDurationMinutes;
    
    allSlots.forEach((time, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        
        // Show only 12-hour format
        slotElement.textContent = formatTimeToArabic12Hour(time);
        
        // Check if time slot is in the past
        const isPastTime = isTimeSlotInPast(selectedDate, time);
        
        if (bookedSlots.includes(time)) {
            slotElement.classList.add('booked');
            slotElement.title = 'محجوز';
        } else if (isPastTime) {
            slotElement.classList.add('booked');
            slotElement.title = 'الوقت قد انتهى';
        } else if (availableSlots.includes(time)) {
            // Check if we have enough consecutive slots for the selected duration
            const canBook = canBookConsecutiveSlots(index, slotsNeeded, allSlots, bookedSlots, availableSlots);
            
            if (canBook) {
                slotElement.addEventListener('click', () => selectTimeSlot(time, slotElement, selectedDuration));
                
                // Add duration indicator
                if (selectedDuration > 30) {
                    const durationText = document.createElement('span');
                    durationText.className = 'duration-indicator';
                    durationText.textContent = ` (${selectedDuration}د)`;
                    slotElement.appendChild(durationText);
                }
            } else {
                slotElement.classList.add('booked');
                slotElement.title = 'لا توجد مواعيد كافية متتالية';
            }
        } else {
            slotElement.classList.add('booked');
            slotElement.title = 'غير متاح';
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

// Check if we can book consecutive slots starting from a given index
function canBookConsecutiveSlots(startIndex, slotsNeeded, allSlots, bookedSlots, availableSlots) {
    // Check if we have enough slots remaining
    if (startIndex + slotsNeeded > allSlots.length) {
        return false;
    }
    
    // Check if all required consecutive slots are available
    for (let i = 0; i < slotsNeeded; i++) {
        const slotTime = allSlots[startIndex + i];
        if (bookedSlots.includes(slotTime) || !availableSlots.includes(slotTime)) {
            return false;
        }
        
        // Check if slot is in the past
        if (isTimeSlotInPast(selectedDate, slotTime)) {
            return false;
        }
    }
    
    return true;
}

// Generate all possible time slots based on config
function generateAllTimeSlots() {
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

// Select a time slot
function selectTimeSlot(time, element, duration) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected, .time-slot.selected-group').forEach(slot => {
        slot.classList.remove('selected', 'selected-group');
    });
    
    // Add selection to clicked slot and consecutive slots
    const allSlots = generateAllTimeSlots();
    const startIndex = allSlots.indexOf(time);
    const slotsNeeded = duration / config.slotDurationMinutes;
    
    // Highlight all selected slots
    for (let i = 0; i < slotsNeeded; i++) {
        const slotIndex = startIndex + i;
        if (slotIndex < allSlots.length) {
            const slotElement = timeSlotsContainer.children[slotIndex];
            if (i === 0) {
                slotElement.classList.add('selected');
            } else {
                slotElement.classList.add('selected-group');
            }
        }
    }
    
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
    const selectedDuration = parseInt(durationSelect.value);
    const isRecurring = enableRecurringCheckbox.checked;
    const recurringWeeks = isRecurring ? parseInt(recurringWeeksSelect.value) : 1;
    
    const bookingData = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        isRecurring: isRecurring,
        recurringWeeks: recurringWeeks
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
            const durationText = selectedDuration === 30 ? '30 دقيقة' : 
                                selectedDuration === 60 ? 'ساعة واحدة' :
                                selectedDuration === 90 ? 'ساعة ونصف' : 'ساعتان';
            
            let successMessage = '';
            
            // Handle payment confirmation scenario
            if (result.booking.status === 'pending' && result.booking.paymentInfo) {
                successMessage = `✅ تم إنشاء حجزك بنجاح!

🔢 رقم الحجز: ${result.booking.bookingNumber}
📅 التاريخ: ${selectedDate}
⏰ الوقت: ${result.booking.startTime} - ${result.booking.endTime}
⏱️ المدة: ${durationText}
💰 السعر: ${result.booking.price} ${config.currency}

💳 معلومات الدفع:
${result.booking.paymentInfo.vodafoneCash ? `📱 فودافون كاش: ${result.booking.paymentInfo.vodafoneCash}` : ''}
${result.booking.paymentInfo.instaPay ? `💳 إنستاباي: ${result.booking.paymentInfo.instaPay}` : ''}

⚠️ يرجى الدفع خلال ساعة واحدة لتأكيد الحجز
📞 للاستعلام عن حالة الحجز، اختر "فحص الحجز" من القائمة`;

                if (result.booking.paymentInfo.instructions) {
                    successMessage += `\n\n📋 ${result.booking.paymentInfo.instructions}`;
                }
            } else {
                // Regular confirmed booking
                successMessage = `🎉 تم إنشاء حجزك بنجاح!

🔢 رقم الحجز: ${result.booking.bookingNumber}
📅 التاريخ: ${selectedDate}
⏰ الوقت: ${result.booking.startTime} - ${result.booking.endTime}
⏱️ المدة: ${durationText}
💰 السعر: ${result.booking.price} ${config.currency}`;
            }

            // Add recurring booking info if applicable
            if (result.booking.isRecurring && result.booking.recurringWeeks > 1) {
                successMessage += `\n� حجز متكرر: ${result.booking.recurringWeeks} أسابيع`;
                if (result.booking.bookingDates && result.booking.bookingDates.length > 1) {
                    successMessage += `\n📋 التواريخ: ${result.booking.bookingDates.join(', ')}`;
                }
            }
            
            successMessage += `\n\n�📍 يرجى الوصول قبل الموعد بـ 10 دقائق`;
            
            showSuccess(successMessage, result.booking);
            
            // Reset form
            bookingForm.reset();
            durationSelect.value = '60'; // Reset to default
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
function showSuccess(message, booking = null) {
    console.log('🔍 showSuccess called with:', { message, booking });
    
    if (booking) {
        // Store booking data in sessionStorage for the success page
        const sessionKey = `booking_${booking.id}`;
        const bookingData = {
            ...booking,
            createdAt: new Date().toISOString(), // Add creation time for countdown
            message: message
        };
        
        sessionStorage.setItem(sessionKey, JSON.stringify(bookingData));
        
        // Redirect to success page
        window.location.href = `/booking-success.html?booking=${booking.id}`;
    } else {
        // Fallback for bookings without data
        alert(message);
    }
}

// Start payment countdown timer
function startPaymentCountdown() {
    const countdownElement = document.getElementById('countdownTimer');
    const timeoutSeconds = config.paymentInfo?.paymentTimeoutSeconds || 10;
    let secondsLeft = timeoutSeconds;
    
    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    const updateCountdown = () => {
        countdownElement.textContent = secondsLeft;
        
        if (secondsLeft <= 0) {
            // Clear the interval
            clearInterval(countdownInterval);
            countdownInterval = null;
            
            // Redirect to InstaPay link automatically
            if (config.paymentInfo?.instaPayLink) {
                window.open(config.paymentInfo.instaPayLink, '_blank');
            }
            return;
        }
        
        secondsLeft--;
    };
    
    // Start the countdown
    updateCountdown(); // Initial call
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Setup payment buttons
function setupPaymentButtons() {
    const instaPayBtn = document.getElementById('instaPayBtn');
    const vodafoneBtn = document.getElementById('vodafoneBtn');
    const skipTimerBtn = document.getElementById('skipTimerBtn');
    const hidePaymentBtn = document.getElementById('hidePaymentBtn');
    
    // InstaPay button handler
    if (instaPayBtn) {
        instaPayBtn.onclick = () => {
            if (config.paymentInfo?.instaPayLink) {
                window.open(config.paymentInfo.instaPayLink, '_blank');
            }
        };
    }
    
    // Skip timer button handler
    if (skipTimerBtn) {
        skipTimerBtn.onclick = () => {
            // Stop the countdown
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            // Open InstaPay immediately
            if (config.paymentInfo?.instaPayLink) {
                window.open(config.paymentInfo.instaPayLink, '_blank');
            }
            
            // Update UI to show timer was skipped
            const countdownElement = document.getElementById('countdownTimer');
            countdownElement.textContent = '✓';
            countdownElement.style.background = '#4CAF50';
            countdownElement.style.borderColor = '#4CAF50';
            
            skipTimerBtn.textContent = 'تم فتح صفحة الدفع ✓';
            skipTimerBtn.style.background = '#4CAF50';
            skipTimerBtn.disabled = true;
        };
    }
    
    // Hide payment section button handler
    if (hidePaymentBtn) {
        hidePaymentBtn.onclick = () => {
            const paymentSection = document.getElementById('paymentSection');
            paymentSection.style.display = 'none';
            
            // Stop countdown if running
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        };
    }
    
    // Vodafone Cash button handler (copy number to clipboard)
    if (vodafoneBtn) {
        vodafoneBtn.onclick = () => {
            if (config.paymentInfo?.vodafoneCash) {
                navigator.clipboard.writeText(config.paymentInfo.vodafoneCash).then(() => {
                    // Show temporary feedback
                    const originalText = vodafoneBtn.innerHTML;
                    vodafoneBtn.innerHTML = '✅ تم نسخ الرقم';
                    vodafoneBtn.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
                    
                    setTimeout(() => {
                        vodafoneBtn.innerHTML = originalText;
                        vodafoneBtn.style.background = 'linear-gradient(135deg, #e74c3c, #ff6b6b)';
                    }, 2000);
                }).catch(() => {
                    // Fallback: show number in alert
                    alert(`رقم فودافون كاش: ${config.paymentInfo.vodafoneCash}`);
                });
            }
        };
    }
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
    // Stop countdown timer if running
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
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
