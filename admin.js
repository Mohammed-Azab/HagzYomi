/**
 * HagzYomi - Admin Panel JavaScript
 * 
 * @author Mohammed Azab
 * @email Mohammed@azab.io
 * @copyright 2025 Mohammed Azab. All rights reserved.
 * @description Admin panel functionality for managing bookings and generating reports
 */

// Global variables
let bookings = [];
let bookingToDelete = null;
let config = {};

// DOM elements
const bookingsTable = document.getElementById('bookingsTable');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const deleteModal = document.getElementById('deleteModal');

// Configuration modal elements
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const reloadConfigBtn = document.getElementById('reloadConfigBtn');
const configContent = document.getElementById('configContent');

// Download modal elements
const downloadModal = document.getElementById('downloadModal');
const downloadModalBtn = document.getElementById('downloadModalBtn');
const reportTypeSelect = document.getElementById('reportType');
const singleDateInput = document.getElementById('singleDate');
const weekDateInput = document.getElementById('weekDate');
const monthDateInput = document.getElementById('monthDate');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const downloadConfirmBtn = document.getElementById('downloadConfirmBtn');
const formatButtons = document.querySelectorAll('[data-format]');

// Date groups
const singleDateGroup = document.getElementById('singleDateGroup');
const weeklyGroup = document.getElementById('weeklyGroup');
const monthlyGroup = document.getElementById('monthlyGroup');
const customDateGroup = document.getElementById('customDateGroup');

let selectedFormat = null;

// Statistics elements
const totalBookingsEl = document.getElementById('totalBookings');
const todayBookingsEl = document.getElementById('todayBookings');
const totalRevenueEl = document.getElementById('totalRevenue');
const popularTimesEl = document.getElementById('popularTimes');
const avgDailyEl = document.getElementById('avgDaily');
const lastBookingEl = document.getElementById('lastBooking');

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();
    setupEventListeners();
    setTodayDate();
    loadBookings();
    updatePageTitle();
});

// Setup event listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', loadBookings);
    logoutBtn.addEventListener('click', logout);
    
    // Configuration modal handlers
    configBtn.addEventListener('click', showConfigModal);
    reloadConfigBtn.addEventListener('click', reloadConfiguration);
    document.getElementById('closeConfigModal').addEventListener('click', hideConfigModal);
    document.getElementById('closeConfigModalBtn').addEventListener('click', hideConfigModal);
    
    // Download modal handlers
    downloadModalBtn.addEventListener('click', showDownloadModal);
    reportTypeSelect.addEventListener('change', handleReportTypeChange);
    downloadConfirmBtn.addEventListener('click', downloadSelectedReport);
    document.getElementById('cancelDownloadBtn').addEventListener('click', hideDownloadModal);
    document.getElementById('closeDownloadModal').addEventListener('click', hideDownloadModal);
    
    // Format selection handlers
    formatButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            selectFormat(this.getAttribute('data-format'));
        });
    });
    
    // Delete modal handlers
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteModal);
    document.getElementById('closeDeleteModal').addEventListener('click', hideDeleteModal);
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) hideDeleteModal();
    });
    
    downloadModal.addEventListener('click', function(e) {
        if (e.target === downloadModal) hideDownloadModal();
    });
}

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
        document.title = `لوحة الإدارة - ${config.courtName}`;
        
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

// Set today's date as default for report
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    singleDateInput.value = today;
    weekDateInput.value = today;
    startDateInput.value = today;
    endDateInput.value = today;
    
    // Set current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthDateInput.value = currentMonth;
}

// Load all bookings from server
async function loadBookings() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'جاري التحديث...';
        
        const response = await fetch('/api/admin/bookings');
        
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        
        bookings = await response.json();
        renderBookings();
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        showMessage('خطأ في تحميل الحجوزات', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 تحديث';
    }
}

// Render bookings table
function renderBookings() {
    if (bookings.length === 0) {
        bookingsTable.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    لا توجد حجوزات حتى الآن
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort bookings by date and time (newest first)
    const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
    });
    
    bookingsTable.innerHTML = sortedBookings.map(booking => `
        <tr>
            <td style="font-weight: 600; color: var(--primary-color);">${booking.bookingNumber || booking.id}</td>
            <td>${booking.name}</td>
            <td>
                <a href="tel:${booking.phone}" style="color: var(--primary-color); text-decoration: none;">
                    ${booking.phone}
                </a>
            </td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.time}</td>
            <td>${booking.price} جنيه</td>
            <td>
                <span class="status-badge status-${booking.status || 'confirmed'}">
                    ${getStatusText(booking.status || 'confirmed')}
                </span>
            </td>
            <td>${formatDateTime(booking.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-success btn-small" onclick="confirmBooking('${booking.bookingNumber}', 'confirm')" title="تأكيد الحجز">
                            ✅ تأكيد
                        </button>
                        <button class="btn btn-warning btn-small" onclick="confirmBooking('${booking.bookingNumber}', 'decline')" title="رفض الحجز">
                            ❌ رفض
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="showDeleteModal('${booking.id}')" title="حذف الحجز">
                        🗑️ حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Total bookings
    totalBookingsEl.textContent = bookings.length;
    
    // Today's bookings
    const todayBookings = bookings.filter(booking => booking.date === today);
    todayBookingsEl.textContent = todayBookings.length;
    
    // Total revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    totalRevenueEl.textContent = `${totalRevenue} جنيه`;
    
    // Popular times
    const timeCount = {};
    bookings.forEach(booking => {
        timeCount[booking.time] = (timeCount[booking.time] || 0) + 1;
    });
    
    const popularTime = Object.entries(timeCount)
        .sort(([,a], [,b]) => b - a)[0];
    
    popularTimesEl.textContent = popularTime ? 
        `${popularTime[0]} (${popularTime[1]} مرة)` : '-';
    
    // Average daily bookings
    const uniqueDates = [...new Set(bookings.map(b => b.date))];
    const avgDaily = uniqueDates.length > 0 ? 
        (bookings.length / uniqueDates.length).toFixed(1) : 0;
    avgDailyEl.textContent = `${avgDaily} حجز/يوم`;
    
    // Last booking
    if (bookings.length > 0) {
        const lastBooking = bookings.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        lastBookingEl.textContent = `${lastBooking.name} - ${formatDateTime(lastBooking.createdAt)}`;
    } else {
        lastBookingEl.textContent = '-';
    }
}

// Show download modal
function showDownloadModal() {
    downloadModal.classList.add('show');
}

// Hide download modal
function hideDownloadModal() {
    downloadModal.classList.remove('show');
    selectedFormat = null;
    
    // Reset all format buttons
    formatButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.background = '';
        btn.style.color = '';
    });
    
    // Reset form
    downloadConfirmBtn.disabled = true;
    downloadConfirmBtn.textContent = 'تحميل التقرير';
    
    // Reset report type to daily
    reportTypeSelect.value = 'daily';
    handleReportTypeChange();
}

// Handle report type change
function handleReportTypeChange() {
    const reportType = reportTypeSelect.value;
    
    // Hide all date groups
    singleDateGroup.style.display = 'none';
    weeklyGroup.style.display = 'none';
    monthlyGroup.style.display = 'none';
    customDateGroup.style.display = 'none';
    
    // Show relevant date group
    switch(reportType) {
        case 'daily':
            singleDateGroup.style.display = 'block';
            break;
        case 'weekly':
            weeklyGroup.style.display = 'block';
            break;
        case 'monthly':
            monthlyGroup.style.display = 'block';
            break;
        case 'custom':
            customDateGroup.style.display = 'block';
            break;
    }
}

// Select format
function selectFormat(format) {
    selectedFormat = format;
    
    // Remove selected class from all buttons
    formatButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.background = '';
        btn.style.color = '';
    });
    
    // Add selected class to clicked button
    const selectedBtn = document.querySelector(`[data-format="${format}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        console.log(`Format selected: ${format}`); // Debug log
    }
    
    // Enable download button
    downloadConfirmBtn.disabled = false;
    downloadConfirmBtn.textContent = 'تحميل التقرير';
}

// Download selected report
async function downloadSelectedReport() {
    if (!selectedFormat) {
        showMessage('يرجى اختيار صيغة الملف', 'error');
        return;
    }
    
    const reportType = reportTypeSelect.value;
    let dateParams = {};
    
    // Get date parameters based on report type
    switch(reportType) {
        case 'daily':
            if (!singleDateInput.value) {
                showMessage('يرجى اختيار التاريخ', 'error');
                return;
            }
            dateParams = { date: singleDateInput.value };
            break;
            
        case 'weekly':
            if (!weekDateInput.value) {
                showMessage('يرجى اختيار تاريخ في الأسبوع', 'error');
                return;
            }
            dateParams = { weekDate: weekDateInput.value };
            break;
            
        case 'monthly':
            if (!monthDateInput.value) {
                showMessage('يرجى اختيار الشهر', 'error');
                return;
            }
            dateParams = { month: monthDateInput.value };
            break;
            
        case 'custom':
            if (!startDateInput.value || !endDateInput.value) {
                showMessage('يرجى اختيار تاريخ البداية والنهاية', 'error');
                return;
            }
            if (new Date(startDateInput.value) > new Date(endDateInput.value)) {
                showMessage('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
                return;
            }
            dateParams = { 
                startDate: startDateInput.value, 
                endDate: endDateInput.value 
            };
            break;
    }
    
    try {
        downloadConfirmBtn.disabled = true;
        downloadConfirmBtn.textContent = 'جاري التحميل...';
        
        // Build URL with parameters
        const params = new URLSearchParams({
            format: selectedFormat,
            type: reportType,
            ...dateParams
        });
        
        const response = await fetch(`/api/admin/report?${params}`);
        
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        
        if (!response.ok) {
            throw new Error('فشل في تحميل التقرير');
        }
        
        console.log('Response received:', response.status, response.headers.get('content-type'));
        console.log('Response size:', response.headers.get('content-length'));
        
        const blob = await response.blob();
        console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
        
        // Check if blob is empty
        if (blob.size === 0) {
            throw new Error('تم تحميل ملف فارغ - يرجى المحاولة مرة أخرى');
        }
        
        // Create download using different method for better browser compatibility
        const url = window.URL.createObjectURL(blob);
        
        // Generate filename
        const formatExtensions = {
            csv: 'csv',
            excel: 'xlsx',
            pdf: 'pdf'
        };
        
        const dateStr = reportType === 'daily' ? dateParams.date : 
                       reportType === 'weekly' ? `week_${dateParams.weekDate}` :
                       reportType === 'monthly' ? `month_${dateParams.month}` :
                       `${dateParams.startDate}_to_${dateParams.endDate}`;
        
        const filename = `report_${reportType}_${dateStr}.${formatExtensions[selectedFormat]}`;
        
        // Try multiple download methods for better compatibility
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            // For IE and Edge
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            // For modern browsers
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            console.log('Download filename:', filename);
            console.log('Blob URL:', url);
            
            document.body.appendChild(a);
            a.click();
            
            // Cleanup after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
            }, 1000);
        }
        
        showMessage('تم تحميل التقرير بنجاح', 'success');
        hideDownloadModal();
        
    } catch (error) {
        console.error('Error downloading report:', error);
        showMessage('خطأ في تحميل التقرير', 'error');
    } finally {
        downloadConfirmBtn.disabled = false;
        downloadConfirmBtn.textContent = 'تحميل التقرير';
    }
}

// Update report button text based on selected date
function updateReportButton() {
    const selectedDate = reportDateInput.value;
    if (selectedDate) {
        downloadReportBtn.textContent = `📥 تحميل تقرير ${formatDate(selectedDate)}`;
    }
}

// Download daily report
async function downloadReport() {
    const selectedDate = reportDateInput.value;
    if (!selectedDate) {
        showMessage('يرجى اختيار تاريخ التقرير', 'error');
        return;
    }
    
    try {
        downloadReportBtn.disabled = true;
        downloadReportBtn.textContent = 'جاري التحميل...';
        
        const response = await fetch(`/api/admin/report/${selectedDate}`);
        
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        
        if (!response.ok) {
            throw new Error('فشل في تحميل التقرير');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showMessage('تم تحميل التقرير بنجاح', 'success');
        
    } catch (error) {
        console.error('Error downloading report:', error);
        showMessage('خطأ في تحميل التقرير', 'error');
    } finally {
        downloadReportBtn.disabled = false;
        updateReportButton();
    }
}

// Show delete confirmation modal
function showDeleteModal(bookingId) {
    bookingToDelete = bookingId;
    deleteModal.classList.add('show');
}

// Hide delete modal
function hideDeleteModal() {
    bookingToDelete = null;
    deleteModal.classList.remove('show');
}

// Confirm booking deletion
async function confirmDelete() {
    if (!bookingToDelete) return;
    
    try {
        const response = await fetch(`/api/admin/booking/${bookingToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('تم حذف الحجز بنجاح', 'success');
            loadBookings(); // Reload bookings
        } else {
            showMessage(result.message || 'فشل في حذف الحجز', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting booking:', error);
        showMessage('خطأ في حذف الحجز', 'error');
    } finally {
        hideDeleteModal();
    }
}

// Logout
async function logout() {
    try {
        await fetch('/admin/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('ar-EG', options);
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const dateOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    const dateStr = date.toLocaleDateString('ar-EG', dateOptions);
    const timeStr = date.toLocaleTimeString('ar-EG', timeOptions);
    
    return `${dateStr} ${timeStr}`;
}

function showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Configuration modal functions
function showConfigModal() {
    loadConfigContent();
    configModal.classList.add('show');
}

function hideConfigModal() {
    configModal.classList.remove('show');
}

async function loadConfigContent() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        // Remove sensitive information before displaying
        const displayConfig = { ...config };
        delete displayConfig.adminPassword;
        
        // Format JSON with proper indentation
        configContent.textContent = JSON.stringify(displayConfig, null, 2);
    } catch (error) {
        console.error('Error loading config:', error);
        configContent.textContent = 'خطأ في تحميل الإعدادات';
    }
}

async function reloadConfiguration() {
    try {
        reloadConfigBtn.disabled = true;
        reloadConfigBtn.textContent = 'جاري إعادة التحميل...';
        
        const response = await fetch('/api/admin/reload-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('تم إعادة تحميل الإعدادات بنجاح', 'success');
            
            // Reload the config content in the modal
            await loadConfigContent();
            
            // Optionally reload the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showMessage(result.message || 'فشل في إعادة تحميل الإعدادات', 'error');
        }
    } catch (error) {
        console.error('Error reloading config:', error);
        showMessage('خطأ في الاتصال بالخادم', 'error');
    } finally {
        reloadConfigBtn.disabled = false;
        reloadConfigBtn.textContent = '🔄 إعادة تحميل الإعدادات';
    }
}

// Auto-refresh bookings every 30 seconds
setInterval(() => {
    if (!document.hidden) {
        loadBookings();
    }
}, 30000);

// Get status text in Arabic
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'في انتظار الدفع';
        case 'confirmed': return 'مؤكد';
        case 'declined': return 'مرفوض';
        case 'expired': return 'منتهي الصلاحية';
        default: return 'مؤكد';
    }
}

// Confirm or decline booking payment
async function confirmBooking(bookingNumber, action) {
    const actionText = action === 'confirm' ? 'تأكيد' : 'رفض';
    
    if (!confirm(`هل أنت متأكد من ${actionText} هذا الحجز؟`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/confirm-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingNumber: bookingNumber,
                action: action
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            await loadBookings(); // Reload bookings to reflect changes
        } else {
            showMessage(result.message || `فشل في ${actionText} الحجز`, 'error');
        }
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        showMessage(`حدث خطأ أثناء ${actionText} الحجز`, 'error');
    }
}
