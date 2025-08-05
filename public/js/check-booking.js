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
        document.title = `استعلام عن حالة الحجز - ${config.courtName}`;

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
        checkBtn.textContent = 'استعلام عن الحجز';
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
            
        const minDepositInfo = booking.paid_amount < 200 
            ? `<div class="deposit-notice">
                 <p><strong>💰 الحد الأدنى للدفع:</strong> 200 جنيه لتأكيد الحجز</p>
                 <p>يمكن دفع المبلغ المتبقي لاحقاً</p>
               </div>`
            : '';
            
        paymentInfo = `
            <div class="payment-info">
                <h4>معلومات الدفع:</h4>
                ${minDepositInfo}
                <p><strong>فودافون كاش:</strong> ${booking.paymentInfo.vodafoneCash}</p>
                <p><strong>إنستاباي:</strong> ${booking.paymentInfo.instaPay}</p>
                <p class="payment-instructions">${booking.paymentInfo.instructions}</p>
                ${paymentLinkButton}
            </div>
        `;
    }

    // Add contact information section
    let contactInfo = '';
    if (config && config.contactInfo) {
        console.log('📋 Adding contact info section:', config.contactInfo);
        contactInfo = `
            <div class="contact-info">
                <h4>📋 معلومات الاتصال</h4>
                <div class="contact-details">
                    ${config.contactInfo.phone ? `<p><strong>📞 للاستفسار:</strong> <a href="tel:${config.contactInfo.phone}">${config.contactInfo.phone}</a></p>` : ''}
                    ${config.contactInfo.address ? `<p><strong>📍 العنوان:</strong> ${config.contactInfo.address}</p>` : ''}
                    ${config.contactInfo.email ? `<p><strong>✉️ البريد الإلكتروني:</strong> <a href="mailto:${config.contactInfo.email}">${config.contactInfo.email}</a></p>` : ''}
                    ${config.openingHours ? `<p><strong>🕐 مواعيد العمل:</strong> من ${config.openingHours.start} إلى ${config.openingHours.end}</p>` : ''}
                </div>
            </div>
        `;
    } else {
        console.log('⚠️ No contact info available in config:', config);
    }

    // Add important guidelines section
    let importantGuidelines = `
        <div class="important-guidelines">
            <h4>⚠️ تعليمات مهمة</h4>
            <div class="important-notes">
                <p><strong>📅 الوصول:</strong> يرجى الوصول قبل موعد الحجز بـ 10 دقائق على الأقل</p>
                <p><strong>⏰ التأخير:</strong> في حالة التأخير أكثر من 15 دقيقة، قد يتم إلغاء الحجز</p>
                <p><strong>🆔 الهوية:</strong> يرجى إحضار بطاقة هوية سارية</p>
                <p><strong>⚽ المعدات:</strong> الكرة متوفرة أو يمكنك إحضار كرتك الخاصة</p>
            </div>
        </div>
    `;

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
            <div class="booking-status-section" style="
                background: ${booking.status === 'pending' ? 'linear-gradient(135deg, #FFA726, #FF7043)' : 
                            booking.status === 'confirmed' ? 'linear-gradient(135deg, #66BB6A, #4CAF50)' : 
                            booking.status === 'declined' ? 'linear-gradient(135deg, #EF5350, #F44336)' : 
                            booking.status === 'expired' ? 'linear-gradient(135deg, #BDBDBD, #9E9E9E)' :
                            'linear-gradient(135deg, #BDBDBD, #9E9E9E)'};
                color: white;
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
                margin-bottom: 2rem;
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                position: relative;
                overflow: hidden;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                    ${booking.status === 'pending' ? '⏳' : 
                      booking.status === 'confirmed' ? '✅' : 
                      booking.status === 'declined' ? '❌' : 
                      booking.status === 'expired' ? '⏰' : '❓'}
                </div>
                <h2 style="font-size: 2rem; font-weight: bold; margin: 0 0 0.5rem 0; text-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                    حالة الحجز
                </h2>
                <h3 style="font-size: 1.6rem; font-weight: 600; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                    ${getStatusText(booking.status)}
                </h3>
                ${booking.status === 'pending' ? `
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; opacity: 0.95; font-weight: 500;">
                    يرجى إتمام الدفع خلال الوقت المحدد لتأكيد حجزك
                </p>
                ` : booking.status === 'confirmed' ? `
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; opacity: 0.95; font-weight: 500;">
                    تم تأكيد حجزك بنجاح - مرحباً بك!
                </p>
                ` : booking.status === 'declined' ? `
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; opacity: 0.95; font-weight: 500;">
                    تم رفض الحجز - يرجى الاتصال للاستفسار
                </p>
                ` : booking.status === 'expired' ? `
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; opacity: 0.95; font-weight: 500;">
                    انتهت مهلة الدفع - يمكنك إعادة الحجز
                </p>
                ` : ''}
            </div>
            
            <div class="booking-header">
                <h4>حجز رقم: ${booking.bookingNumber}</h4>
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
                    <span class="label">السعر الإجمالي:</span>
                    <span class="value">${booking.isRecurring && booking.recurringWeeks > 1 ? `${booking.price} جنيه (لكل أسبوع)` : `${booking.price} جنيه`}</span>
                </div>
                ${booking.paid_amount !== undefined ? `
                <div class="info-row payment-row">
                    <span class="label">المبلغ المدفوع:</span>
                    <span class="value payment-paid">${booking.paid_amount || 0} جنيه</span>
                </div>
                <div class="info-row payment-row">
                    <span class="label">المبلغ المتبقي:</span>
                    <span class="value payment-remaining">${(booking.price || 0) - (booking.paid_amount || 0)} جنيه</span>
                </div>
                <div class="info-row payment-row">
                    <span class="label">حالة الدفع:</span>
                    <span class="value payment-status ${(booking.paid_amount || 0) >= (booking.price || 0) ? 'fully-paid' : 'partially-paid'}">
                        ${(booking.paid_amount || 0) >= (booking.price || 0) ? 'مدفوع بالكامل' : 
                          (booking.paid_amount || 0) >= 200 ? 'دفعة جزئية (مؤكد)' : 
                          'في انتظار الدفع'}
                    </span>
                </div>
                ` : `
                <div class="info-row">
                    <span class="label">السعر:</span>
                    <span class="value">${booking.isRecurring && booking.recurringWeeks > 1 ? `${booking.price} جنيه (لكل أسبوع)` : `${booking.price} جنيه`}</span>
                </div>
                `}
                <div class="info-row">
                    <span class="label">تاريخ الحجز:</span>
                    <span class="value">${new Date(booking.createdAt).toLocaleString('ar-EG')}</span>
                </div>
            </div>
            ${recurringInfo}
            ${timeRemaining}
            ${paymentInfo}
            ${contactInfo}
            ${importantGuidelines}
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
