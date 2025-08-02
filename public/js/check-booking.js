/**
 * HagzYomi - Booking Status Check
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @copyright 2025 Mohammed Azab. All rights reserved.
 */

// DOM elements
const checkBookingForm = document.getElementById('checkBookingForm');
const bookingNumberInput = document.getElementById('bookingNumber'); // Can be booking number or phone number
const customerNameInput = document.getElementById('customerName');
const checkBtn = document.getElementById('checkBtn');
const bookingResult = document.getElementById('bookingResult');
const bookingDetails = document.getElementById('bookingDetails');

// Configuration
let config = {};

// Modal elements
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();
    setupEventListeners();
    updatePageTitle();
});

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        config = await response.json();
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Update page title and header with config
function updatePageTitle() {
    if (config.courtName) {
        // Update page title
        document.title = `فحص حالة الحجز - ${config.courtName}`;
        
        // Update header title
        const logoTitle = document.querySelector('.logo h1');
        if (logoTitle) {
            logoTitle.textContent = `⚽ ${config.ui?.headerTitle || config.courtName}`;
        }
        
        // Update CSS variables if UI config is provided
        if (config.ui && config.ui.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', config.ui.primaryColor);
            document.documentElement.style.setProperty('--accent-color', config.ui.primaryColor);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    checkBookingForm.addEventListener('submit', handleFormSubmit);
    setupModalHandlers();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const bookingNumber = bookingNumberInput.value.trim();
    const customerName = customerNameInput.value.trim();
    
    if (!bookingNumber || !customerName) {
        showError('يرجى إدخال رقم الحجز/رقم الهاتف والاسم');
        return;
    }
    
    try {
        checkBtn.disabled = true;
        checkBtn.textContent = 'جاري البحث...';
        
        const response = await fetch('/api/check-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingNumber: bookingNumber,
                name: customerName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayBookingDetails(result.booking);
        } else {
            showError(result.message || 'لم يتم العثور على الحجز');
        }
        
    } catch (error) {
        console.error('Check booking error:', error);
        showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = 'فحص الحجز';
    }
}

// Display booking details
function displayBookingDetails(booking) {
    const statusText = getStatusText(booking.status);
    const statusClass = getStatusClass(booking.status);
    
    let timeRemaining = '';
    if (booking.status === 'pending' && booking.createdAt) {
        // Calculate 1 hour from booking creation time
        const createdTime = new Date(booking.createdAt);
        const expirationTime = new Date(createdTime.getTime() + (60 * 60 * 1000)); // Add 1 hour
        const remaining = calculateTimeRemaining(expirationTime.toISOString());
        if (remaining > 0) {
            timeRemaining = `<div class="time-remaining">⏰ الوقت المتبقي للدفع: ${formatTime(remaining)}</div>`;
        } else {
            timeRemaining = `<div class="time-expired">⏰ انتهت مهلة الدفع</div>`;
        }
    }
    
    let paymentInfo = '';
    if (booking.status === 'pending' && booking.paymentInfo) {
        const paymentLinkButton = booking.paymentInfo.instaPayLink 
            ? `<div class="payment-link-section">
                 <button class="payment-link-btn" onclick="window.open('${booking.paymentInfo.instaPayLink}', '_blank')">
                   💳 رابط انستاباي
                 </button>
               </div>` 
            : '';
            
        paymentInfo = `
            <div class="payment-info">
                <h4>معلومات الدفع:</h4>
                <p><strong>فودافون كاش:</strong> ${booking.paymentInfo.vodafoneCash}</p>
                <p><strong>إنستاباي:</strong> ${booking.paymentInfo.instaPay}</p>
                <p class="payment-instructions">${booking.paymentInfo.instructions}</p>
                ${paymentLinkButton}
            </div>
        `;
    }
    
    let recurringInfo = '';
    if (booking.isRecurring && booking.recurringWeeks > 1) {
        recurringInfo = `
            <div class="recurring-info">
                <p><strong>نوع الحجز:</strong> متكرر أسبوعياً (${booking.recurringWeeks} أسابيع)</p>
                ${booking.bookingDates ? `<p><strong>التواريخ:</strong> ${booking.bookingDates.join(', ')}</p>` : ''}
            </div>
        `;
    }
    
    bookingDetails.innerHTML = `
        <div class="booking-card">
            <div class="booking-header">
                <h4>حجز رقم: ${booking.bookingNumber}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="booking-info">
                <div class="info-row">
                    <span class="label">الاسم:</span>
                    <span class="value">${booking.name}</span>
                </div>
                <div class="info-row">
                    <span class="label">رقم الهاتف:</span>
                    <span class="value">${booking.phone}</span>
                </div>
                <div class="info-row">
                    <span class="label">التاريخ:</span>
                    <span class="value">${booking.date}</span>
                </div>
                <div class="info-row">
                    <span class="label">الوقت:</span>
                    <span class="value">${booking.startTime} - ${booking.endTime}</span>
                </div>
                <div class="info-row">
                    <span class="label">المدة:</span>
                    <span class="value">${booking.duration} دقيقة</span>
                </div>
                <div class="info-row">
                    <span class="label">السعر:</span>
                    <span class="value">${booking.price} جنيه</span>
                </div>
                <div class="info-row">
                    <span class="label">تاريخ الحجز:</span>
                    <span class="value">${new Date(booking.createdAt).toLocaleString('ar-EG')}</span>
                </div>
            </div>
            ${recurringInfo}
            ${timeRemaining}
            ${paymentInfo}
        </div>
    `;
    
    bookingResult.style.display = 'block';
    bookingResult.scrollIntoView({ behavior: 'smooth' });
}

// Get status text in Arabic
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'في انتظار الدفع';
        case 'confirmed': return 'مؤكد';
        case 'declined': return 'مرفوض';
        case 'expired': return 'منتهي الصلاحية';
        default: return status;
    }
}

// Get status CSS class
function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'confirmed': return 'status-confirmed';
        case 'declined': return 'status-declined';
        case 'expired': return 'status-expired';
        default: return 'status-unknown';
    }
}

// Calculate time remaining in minutes
function calculateTimeRemaining(expiresAt) {
    const now = new Date();
    const expires = new Date(expiresAt);
    return Math.max(0, Math.floor((expires - now) / (1000 * 60)));
}

// Format time in Arabic
function formatTime(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ساعة${mins > 0 ? ` و ${mins} دقيقة` : ''}`;
    }
    return `${minutes} دقيقة`;
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
