/**
 * HagzYomi - Booking Success Page
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @copyright 2025 Mohammed Azab. All rights reserved.
 */

// Global variables
let countdownInterval;
let bookingData;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadBookingData();
    setupEventListeners();
});

// Load booking data from URL parameters or sessionStorage
function loadBookingData() {
    // Try to get data from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking');
    
    if (bookingId) {
        // If we have a booking ID, try to get data from sessionStorage
        const sessionKey = `booking_${bookingId}`;
        const sessionData = sessionStorage.getItem(sessionKey);
        
        if (sessionData) {
            try {
                bookingData = JSON.parse(sessionData);
                displayBookingData();
                // Clean up session storage
                sessionStorage.removeItem(sessionKey);
            } catch (error) {
                console.error('Error parsing booking data:', error);
                showError();
            }
        } else {
            showError();
        }
    } else {
        showError();
    }
}

// Display the booking data
function displayBookingData() {
    if (!bookingData) {
        console.error('❌ No booking data available');
        showError();
        return;
    }
    
    // Debug: log the booking data to see what we have
    console.log('📊 Booking data received:', bookingData);
    console.log('📊 Status:', bookingData.status);
    console.log('📊 Payment info:', bookingData.paymentInfo);
    console.log('📊 Created At:', bookingData.createdAt);
    
    // Update confirmation code
    document.getElementById('confirmationCode').textContent = bookingData.bookingNumber;
    
    // Update booking details
    displayBookingDetails();
    
    // Always show payment section and timer for pending bookings
    if (bookingData.status === 'pending') {
        console.log('✅ Booking is pending, showing payment section and timer');
        
        // If no payment info in booking data, use default from config
        if (!bookingData.paymentInfo) {
            console.log('⚠️ No payment info in booking data, fetching from server');
            fetchPaymentInfo().then(paymentInfo => {
                if (paymentInfo) {
                    bookingData.paymentInfo = paymentInfo;
                    displayPaymentInfo();
                    startCountdown();
                } else {
                    console.error('❌ Failed to fetch payment info');
                }
            });
        } else {
            console.log('✅ Payment info available, displaying payment section');
            displayPaymentInfo();
            startCountdown();
        }
    } else {
        console.log('ℹ️ Booking status is not pending:', bookingData.status);
    }
}

// Fetch payment info from server
async function fetchPaymentInfo() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        return config.paymentInfo;
    } catch (error) {
        console.error('Error fetching payment info:', error);
        return {
            vodafoneCash: '01000000000',
            instaPay: 'InstaPay Name',
            instructions: 'يرجى إرسال قيمة الحجز خلال ساعة واحدة لتأكيد الحجز'
        };
    }
}

// Display booking details
function displayBookingDetails() {
    const detailsContainer = document.getElementById('bookingDetails');
    
    const formatTime = (startTime, endTime) => {
        if (endTime && endTime !== startTime) {
            return `${startTime} - ${endTime}`;
        }
        return startTime;
    };
    
    const formatDates = (dates) => {
        if (dates && dates.length > 1) {
            return dates.join(', ');
        }
        return bookingData.date;
    };
    
    detailsContainer.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">الاسم:</span>
            <span class="detail-value">${bookingData.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">رقم الهاتف:</span>
            <span class="detail-value">${bookingData.phone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">التاريخ:</span>
            <span class="detail-value">${formatDates(bookingData.bookingDates)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">الوقت:</span>
            <span class="detail-value">${formatTime(bookingData.startTime, bookingData.endTime)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">المدة:</span>
            <span class="detail-value">${bookingData.duration} دقيقة</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">السعر:</span>
            <span class="detail-value">${bookingData.price} جنيه</span>
        </div>
        ${bookingData.isRecurring ? `
        <div class="detail-row">
            <span class="detail-label">نوع الحجز:</span>
            <span class="detail-value">متكرر (${bookingData.recurringWeeks} أسابيع)</span>
        </div>
        ` : ''}
    `;
}

// Display payment information
function displayPaymentInfo() {
    const paymentSection = document.getElementById('paymentSection');
    const timerSection = document.getElementById('timerSection');
    const instaPayBtn = document.getElementById('instaPayBtn');
    const instaPayMethod = document.getElementById('instaPayMethod');
    
    // Show payment section
    paymentSection.style.display = 'block';
    timerSection.style.display = 'block';
    
    // Update payment details
    document.getElementById('vodafoneNumber').textContent = bookingData.paymentInfo.vodafoneCash;
    document.getElementById('instaPayName').textContent = bookingData.paymentInfo.instaPay;
    document.getElementById('paymentInstructions').textContent = bookingData.paymentInfo.instructions;
    
    // Setup InstaPay method click handler
    if (bookingData.paymentInfo.instaPayLink) {
        instaPayMethod.onclick = () => {
            console.log('👆 User clicked InstaPay method, redirecting');
            window.open(bookingData.paymentInfo.instaPayLink, '_blank');
        };
        
        // Add the clickable class to show the tooltip
        instaPayMethod.classList.add('instapay-clickable');
    } else {
        // Remove clickable functionality if no link is available
        instaPayMethod.onclick = null;
        instaPayMethod.classList.remove('instapay-clickable');
        instaPayMethod.style.cursor = 'default';
        console.log('⚠️ No InstaPay link available');
    }
    
    // Setup InstaPay button if link is available
    if (bookingData.paymentInfo.instaPayLink) {
        instaPayBtn.style.display = 'inline-block';
        instaPayBtn.onclick = () => {
            window.open(bookingData.paymentInfo.instaPayLink, '_blank');
        };
        
        // Start 10-second redirect countdown to InstaPay
        startInstaPayRedirect(bookingData.paymentInfo.instaPayLink);
    }
}

// Start 10-second countdown to redirect to InstaPay
function startInstaPayRedirect(instaPayLink) {
    let redirectCountdown = 10;
    let redirectInterval;
    let hasAutoRedirected = false; // Flag to prevent multiple auto-redirects
    const instaPayBtn = document.getElementById('instaPayBtn');
    
    console.log('🔄 Starting InstaPay redirect countdown...');
    
    // Set up permanent click handler that always works
    instaPayBtn.onclick = () => {
        console.log('👆 User clicked InstaPay button, redirecting');
        window.open(instaPayLink, '_blank');
    };
    
    // Update button text with countdown
    const updateRedirectCountdown = () => {
        if (hasAutoRedirected) {
            clearInterval(redirectInterval);
            return;
        }
        
        instaPayBtn.textContent = `💳 سيتم التوجيه لإنستاباي خلال ${redirectCountdown} ثواني`;
        
        if (redirectCountdown <= 0) {
            hasAutoRedirected = true;
            console.log('🚀 Auto-redirecting to InstaPay:', instaPayLink);
            window.open(instaPayLink, '_blank');
            
            // Reset button text but keep it clickable
            instaPayBtn.textContent = '💳 رابط انستاباي';
            clearInterval(redirectInterval);
            return;
        }
        
        redirectCountdown--;
    };
    
    // Update immediately and then every second
    updateRedirectCountdown();
    redirectInterval = setInterval(updateRedirectCountdown, 1000);
}

// Start countdown timer
function startCountdown() {
    console.log('⏰ Starting countdown timer...');
    console.log('📅 Booking created at:', bookingData.createdAt);
    
    if (!bookingData.createdAt) {
        console.error('❌ No createdAt timestamp available for countdown');
        // Use current time as fallback
        bookingData.createdAt = new Date().toISOString();
        console.log('⚠️ Using current time as fallback:', bookingData.createdAt);
    }
    
    // Calculate time remaining (1 hour from creation)
    const createdAt = new Date(bookingData.createdAt);
    const expiresAt = new Date(createdAt.getTime() + (60 * 60 * 1000)); // Add 1 hour
    
    console.log('⏰ Timer details:', {
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        now: new Date().toISOString()
    });
    
    const updateCountdown = () => {
        const now = new Date();
        const timeLeft = expiresAt - now;
        
        console.log('⏱️ Time left (ms):', timeLeft);
        
        if (timeLeft <= 0) {
            document.getElementById('countdown').textContent = 'انتهت المهلة';
            document.getElementById('countdown').style.color = '#dc3545';
            clearInterval(countdownInterval);
            console.log('⏰ Countdown expired');
            return;
        }
        
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log('⏰ Updating countdown to:', timeText);
        
        document.getElementById('countdown').textContent = timeText;
    };
    
    // Update immediately and then every second
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    
    console.log('✅ Countdown timer started successfully');
}

// Setup event listeners
function setupEventListeners() {
    // Handle back button
    window.addEventListener('popstate', function() {
        window.location.href = '/';
    });
    
    // Copy booking number functionality
    document.getElementById('bookingNumber').addEventListener('click', function() {
        const bookingNumber = document.getElementById('confirmationCode').textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(bookingNumber).then(() => {
                showToast('تم نسخ رقم الحجز');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bookingNumber;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('تم نسخ رقم الحجز');
        }
    });
}

// Show error message
function showError() {
    document.querySelector('.success-card').innerHTML = `
        <div class="success-icon" style="color: #f44336;">❌</div>
        <h1 class="success-title" style="color: #d32f2f;">خطأ في تحميل البيانات</h1>
        <p style="color: #666; margin: 20px 0;">لم يتم العثور على بيانات الحجز. قد يكون السبب تحديث الصفحة أو انتهاء صلاحية الرابط.</p>
        <div class="error-options" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">يمكنك اختيار إحدى الخيارات التالية:</p>
            <div class="action-buttons" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="/" class="btn-payment" style="background: var(--primary-color); text-decoration: none;">🏠 العودة للرئيسية</a>
                <a href="/html/check-booking.html" class="btn-payment" style="background: #17a2b8; text-decoration: none;">🔍 التحقق من حالة الحجز</a>
                <button onclick="window.location.reload()" class="btn-payment" style="background: #6c757d; border: none; cursor: pointer;">🔄 إعادة تحميل الصفحة</button>
            </div>
        </div>
    `;
}

// Show toast notification
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 50%;
        transform: translateX(50%);
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideDown 0.3s ease-out;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
