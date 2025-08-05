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
                config.features.maxRecurringWeeks || 16,
                Math.floor(config.maxBookingDaysAhead / 7)
            );
            
            // Update recurring weeks options
            recurringWeeksSelect.innerHTML = '';
            for (let i = 2; i <= maxWeeks; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i === 4 ? 'شهر (4 أسابيع)' : 
                                   i === 8 ? 'شهرين (8 أسابيع)' : 
                                   i === 12 ? '3 أشهر (12 أسبوع)' :
                                   i === 16 ? '4 أشهر (16 أسبوع)' :
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
    
    // Update price information - show different rates for day/night if available
    if (config.pricing) {
        document.getElementById('priceInfo').innerHTML = 
            `${config.pricing.dayRate} ${config.currency}/ساعة (نهاري)<br>` +
            `${config.pricing.nightRate} ${config.currency}/ساعة (ليلي - من ${config.pricing.nightStartTime})`;
    } else {
        document.getElementById('priceInfo').textContent = 
            `${config.pricePerHour} ${config.currency}/ساعة`;
    }
    
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
    
    // Update contact information if available
    if (config.contactInfo) {
        const contactPhoneElement = document.getElementById('contactPhone');
        const contactAddressElement = document.getElementById('contactAddress');
        const contactEmailElement = document.getElementById('contactEmail');
        
        if (contactPhoneElement && config.contactInfo.phone) {
            contactPhoneElement.textContent = config.contactInfo.phone;
            contactPhoneElement.href = `tel:${config.contactInfo.phone}`;
        }
        
        if (contactAddressElement && config.contactInfo.address) {
            contactAddressElement.textContent = config.contactInfo.address;
        }
        
        if (contactEmailElement && config.contactInfo.email) {
            contactEmailElement.textContent = config.contactInfo.email;
            contactEmailElement.href = `mailto:${config.contactInfo.email}`;
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

// Load available time slots for a date
async function loadTimeSlots(date) {
    try {
        timeSlotsContainer.innerHTML = '<p class="loading">جاري تحميل المواعيد...</p>';
        
        const response = await fetch(`/api/slots/${date}`);
        const data = await response.json();
        
        console.log('Server response for date', date, ':', data);
        console.log('Available slots:', data.slots);
        console.log('Booked slots:', data.bookedSlots);
        
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
    // Use Cairo time to match server logic
    const now = new Date();
    const cairoNow = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
    
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
    
    // Add 30-minute buffer to match server logic
    const thirtyMinutesFromNow = new Date(cairoNow.getTime() + (30 * 60 * 1000));
    
    console.log(`Frontend time check for ${time}: slotTime=${slotDateTime.toISOString()}, cairoNow=${cairoNow.toISOString()}, thirtyMinFromNow=${thirtyMinutesFromNow.toISOString()}, isPast=${slotDateTime <= thirtyMinutesFromNow}`);
    
    return slotDateTime <= thirtyMinutesFromNow;
}

function renderTimeSlots(availableSlots, bookedSlots) {
    timeSlotsContainer.innerHTML = '';
    
    // Always show 30-minute intervals
    const allSlots = generateAllTimeSlots();
    
    allSlots.forEach((time, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.setAttribute('data-time', time); // Add data attribute for easy identification
        
        // Create the time display
        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'time-display';
        timeDisplay.textContent = formatTimeToArabic12Hour(time);
        slotElement.appendChild(timeDisplay);
        
        // Always show 30-minute duration
        const durationText = document.createElement('span');
        durationText.className = 'duration-indicator';
        durationText.textContent = '30د';
        slotElement.appendChild(durationText);
        
        // Check if time slot is in the past
        const isPastTime = isTimeSlotInPast(selectedDate, time);
        
        console.log(`Slot ${time}:`, {
            bookedSlots: bookedSlots.includes(time),
            isPastTime,
            availableSlots: availableSlots.includes(time),
            classification: bookedSlots.includes(time) ? 'booked' : 
                         isPastTime ? 'past' : 
                         availableSlots.includes(time) ? 'available' : 'unavailable'
        });
        
        if (bookedSlots.includes(time)) {
            slotElement.classList.add('booked');
            slotElement.title = 'محجوز';
        } else if (isPastTime) {
            slotElement.classList.add('booked');
            slotElement.title = 'الوقت قد انتهى';
        } else if (availableSlots.includes(time)) {
            slotElement.classList.add('available');
            slotElement.addEventListener('click', () => selectTimeSlot(time, slotElement, 30)); // Always select 30 minutes
            slotElement.title = 'متاح للحجز (30 دقيقة)';
        } else {
            slotElement.classList.add('booked');
            slotElement.title = 'غير متاح';
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
    
    // Initialize booking progress indicator after loading slots
    updateBookingProgress();
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

// Track selected slots for multi-slot booking
let selectedSlots = [];
let maxDuration = 0;

// Select a time slot
function selectTimeSlot(time, element, duration) {
    // Check if this slot is already selected
    const slotIndex = selectedSlots.findIndex(slot => slot.time === time);
    
    if (slotIndex !== -1) {
        // Deselect this slot and all slots after it in the sorted order
        const allSlots = generateAllTimeSlots();
        selectedSlots.sort((a, b) => {
            const indexA = allSlots.indexOf(a.time);
            const indexB = allSlots.indexOf(b.time);
            return indexA - indexB;
        });
        
        const sortedIndex = selectedSlots.findIndex(slot => slot.time === time);
        selectedSlots = selectedSlots.slice(0, sortedIndex);
        updateSlotVisuals();
        updateSubmitButton();
        return;
    }
    
    // Check maximum hours limit before adding new slot
    const currentHours = (selectedSlots.length * 30) / 60; // Convert 30-min slots to hours
    const maxHours = config.maxHoursPerPersonPerDay || 2;
    
    if (currentHours >= maxHours) {
        showError(`لا يمكن حجز أكثر من ${maxHours} ساعة في اليوم الواحد`);
        return;
    }
    
    // Add this slot to selection
    selectedSlots.push({ time });
    
    // Sort slots by time order
    const allSlots = generateAllTimeSlots();
    selectedSlots.sort((a, b) => {
        const indexA = allSlots.indexOf(a.time);
        const indexB = allSlots.indexOf(b.time);
        return indexA - indexB;
    });
    
    // Check if all selected slots are consecutive
    const selectedIndices = selectedSlots.map(slot => allSlots.indexOf(slot.time));
    console.log('Selected times:', selectedSlots.map(s => s.time));
    console.log('Selected indices:', selectedIndices);
    console.log('All slots:', allSlots);
    
    const isConsecutive = selectedIndices.every((index, i) => {
        if (i === 0) return true;
        const isConsec = index === selectedIndices[i - 1] + 1;
        console.log(`Checking ${selectedSlots[i].time} (index ${index}) vs previous ${selectedSlots[i-1].time} (index ${selectedIndices[i-1]}): ${isConsec}`);
        return isConsec;
    });
    
    console.log('Is consecutive:', isConsecutive);
    
    if (isConsecutive) {
        updateSlotVisuals();
        updateSubmitButton();
    } else {
        selectedSlots.pop();
        updateSlotVisuals(); // Force visual refresh after removing invalid slot
        showError('يجب اختيار الأوقات بشكل متتالي');
    }
}

// Update visual appearance of selected slots
function updateSlotVisuals() {
    // Clear all previous selections more thoroughly
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected', 'selected-group');
        // Clear inline styles completely
        slot.style.backgroundColor = '';
        slot.style.color = '';
        slot.style.border = '';
        slot.style.fontWeight = '';
        slot.style.transform = '';
        slot.style.boxShadow = '';
    });
    
    console.log('Applying styles to:', selectedSlots.map(s => s.time));
    
    // Apply new selections using data attributes
    selectedSlots.forEach((slot, index) => {
        const slotElement = timeSlotsContainer.querySelector(`[data-time="${slot.time}"]`);
        
        if (slotElement) {
            if (index === 0) {
                slotElement.classList.add('selected');
                console.log(`Added 'selected' class to ${slot.time}`);
            } else {
                slotElement.classList.add('selected-group');
                console.log(`Added 'selected-group' class to ${slot.time}`);
                // Add inline styles for testing
                slotElement.style.backgroundColor = '#1976D2';
                slotElement.style.color = 'white';
                slotElement.style.border = '2px solid #1976D2';
                slotElement.style.fontWeight = 'bold';
            }
            // Debug: show all classes on the element
            console.log(`Element ${slot.time} classes:`, slotElement.className);
        } else {
            console.error(`Could not find element for ${slot.time}`);
        }
    });
    
    // Update booking progress indicator
    updateBookingProgress();
}

// Calculate end time for a booking
function calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Format hours in Arabic
function formatHoursInArabic(hours) {
    if (hours === 0.5) return 'نصف ساعة';
    if (hours === 1) return 'ساعة';
    if (hours === 1.5) return 'ساعة ونصف';
    if (hours === 2) return 'ساعتان';
    if (hours === 2.5) return 'ساعتان ونصف';
    if (hours === 3) return '3 ساعات';
    if (hours === 3.5) return '3 ساعات ونصف';
    if (hours === 4) return '4 ساعات';
    // For other values, show as decimal with "ساعة"
    return `${hours} ساعة`;
}

// Update booking progress indicator
function updateBookingProgress() {
    const currentHours = (selectedSlots.length * 30) / 60;
    const maxHours = config.maxHoursPerPersonPerDay || 2;
    const remainingHours = maxHours - currentHours;
    
    // Format hours display in Arabic
    const currentHoursDisplay = formatHoursInArabic(currentHours);
    const remainingHoursDisplay = formatHoursInArabic(remainingHours);
    const maxHoursDisplay = formatHoursInArabic(maxHours);
    
    // Find or create progress indicator
    let progressElement = document.getElementById('bookingProgress');
    if (!progressElement) {
        progressElement = document.createElement('div');
        progressElement.id = 'bookingProgress';
        progressElement.style.cssText = 'margin: 10px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;';
        
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.parentNode.insertBefore(progressElement, timeSlotsContainer);
    }
    
    // Always show progress indicator
    if (selectedSlots.length > 0) {
        // Calculate time range
        const startTime = selectedSlots[0].time;
        const endTime = calculateEndTime(startTime, selectedSlots.length * 30);
        const timeRange = `من ${startTime} إلى ${endTime}`;
        
        progressElement.innerHTML = `
            <div style="color: #2196F3; font-weight: bold;">
                📅 محدد حالياً: ${currentHoursDisplay} (${selectedSlots.length} × 30 دقيقة)
            </div>
            <div style="color: #2196F3; margin-top: 5px;">
                🕐 ${timeRange}
            </div>
            <div style="color: ${remainingHours > 0 ? '#4CAF50' : '#f44336'}; margin-top: 5px;">
                ${remainingHours > 0 
                    ? `⏰ متبقي: ${remainingHoursDisplay}` 
                    : '⚠️ وصلت للحد الأقصى المسموح'}
            </div>
        `;
    } else {
        progressElement.innerHTML = `
            <div style="color: #666; font-weight: bold;">
                📅 محدد حالياً: 0 ساعة (0 × 30 دقيقة)
            </div>
            <div style="color: #4CAF50; margin-top: 5px;">
                ⏰ متبقي: ${maxHoursDisplay}
            </div>
        `;
    }
    progressElement.style.display = 'block';
}

// Update submit button state and text
function updateSubmitButton() {
    // Update the first slot's time if we have selections
    if (selectedSlots.length > 0) {
        selectedTime = selectedSlots[0].time;
    } else {
        selectedTime = null;
    }
    
    if (selectedSlots.length === 0) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'احجز الآن';
        return;
    }
    
    const totalDuration = selectedSlots.length * 30;
    const totalHours = totalDuration / 60;
    
    // Format hours display in Arabic
    const hoursDisplay = formatHoursInArabic(totalHours);
    
    submitBtn.disabled = false;
    submitBtn.textContent = `احجز الآن (${hoursDisplay})`;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (selectedSlots.length === 0 || !selectedDate) {
        showError('يرجى اختيار التاريخ والوقت');
        return;
    }
    
    const formData = new FormData(bookingForm);
    const actualDuration = selectedSlots.length * 30; // Calculate actual duration from selected slots
    const isRecurring = enableRecurringCheckbox.checked;
    const recurringWeeks = isRecurring ? parseInt(recurringWeeksSelect.value) : 1;
    
    const bookingData = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        date: selectedDate,
        time: selectedTime, // First selected slot time
        duration: actualDuration, // Use actual selected duration
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
📞 للاستعلام عن حالة الحجز، اختر "استعلام عن الحجز" من القائمة`;

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
            selectedSlots = []; // Reset selected slots
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
    
    // Vodafone Cash button handler (redirect to USSD code)
    if (vodafoneBtn) {
        vodafoneBtn.onclick = () => {
            // First try to open the USSD code
            window.open('tel:*9*7*01157000063*200#', '_self');
            
            // Also show feedback that we're redirecting
            const originalText = vodafoneBtn.innerHTML;
            vodafoneBtn.innerHTML = '📱 جاري فتح فودافون كاش...';
            vodafoneBtn.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
            
            setTimeout(() => {
                vodafoneBtn.innerHTML = originalText;
                vodafoneBtn.style.background = 'linear-gradient(135deg, #e74c3c, #ff6b6b)';
            }, 3000);
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

// Auto-refresh slots every 30 seconds if date is selected (DISABLED to prevent clearing selections)
// setInterval(() => {
//     if (selectedDate && !document.hidden) {
//         loadTimeSlots(selectedDate);
//     }
// }, 30000);
