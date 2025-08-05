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
let userRole = { isAdmin: false, isSuperAdmin: false, isViewer: false };
let currentFilter = 'all';

// DOM elements
const bookingsTable = document.getElementById('bookingsTable');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const deleteModal = document.getElementById('deleteModal');

// Configuration modal elements
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const reloadConfigBtn = document.getElementById('reloadConfigBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
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
    await loadUserRole();
    setupUIPermissions();
    setupEventListeners();
    setTodayDate();
    loadBookings();
    updatePageTitle();
});

// Setup event listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', loadBookings);
    logoutBtn.addEventListener('click', logout);
    
    // Filter button event listeners
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            applyFilter(filter);
        });
    });
    
    // Filter by date button
    const filterByDateBtn = document.getElementById('filterByDate');
    if (filterByDateBtn) {
        filterByDateBtn.addEventListener('click', function() {
            const filterDate = document.getElementById('filterDate');
            if (filterDate && filterDate.value) {
                applyFilter('date', filterDate.value);
            } else {
                showMessage('يرجى اختيار التاريخ', 'error');
            }
        });
    }
    
    // Configuration modal handlers
    configBtn.addEventListener('click', showConfigModal);
    reloadConfigBtn.addEventListener('click', reloadConfiguration);
    saveConfigBtn.addEventListener('click', saveConfiguration);
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
            const format = this.getAttribute('data-format');
            selectFormat(format);
        });
    });
    
    // Delete modal handlers
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteModal);
    document.getElementById('closeDeleteModal').addEventListener('click', hideDeleteModal);
    
    // Close on backdrop click
    configModal.addEventListener('click', function(e) {
        if (e.target === configModal) hideConfigModal();
    });
    
    downloadModal.addEventListener('click', function(e) {
        if (e.target === downloadModal) hideDownloadModal();
    });
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) hideDeleteModal();
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

async function saveConfiguration() {
    if (!userRole.isSuperAdmin) {
        alert('ليس لديك صلاحية لتعديل الإعدادات');
        return;
    }
    
    let configData;
    
    try {
        // Check which editor is active
        const formEditor = document.getElementById('configFormEditor');
        const jsonEditor = document.getElementById('configJsonEditor');
        
        if (formEditor.style.display !== 'none') {
            // Form editor is active - collect form data
            configData = collectConfigFormData();
        } else {
            // JSON editor is active - parse JSON
            const configEditor = document.getElementById('configEditor');
            const configText = configEditor.value;
            configData = JSON.parse(configText);
        }
        
        // Send to server
        const response = await fetch('/api/admin/update-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        if (response.ok) {
            alert('تم حفظ الإعدادات بنجاح');
            hideConfigModal();
            // Reload the page to apply new configuration
            location.reload();
        } else {
            const error = await response.text();
            alert('خطأ في حفظ الإعدادات: ' + error);
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            alert('خطأ في تنسيق البيانات. تأكد من صحة القيم المدخلة.');
        } else {
            console.error('Error saving config:', error);
            alert('خطأ في حفظ الإعدادات');
        }
    }
}

// Reload configuration from server
async function reloadConfiguration() {
    await loadConfig();
    loadConfigContent();
    showMessage('تم تحديث الإعدادات', 'success');
}

// Configuration modal functions
function showConfigModal() {
    loadConfigContent();
    setupConfigModalForUser();
    setupConfigTabListeners();
    configModal.classList.add('show');
}

// Setup config tab event listeners
function setupConfigTabListeners() {
    // Remove any existing listeners to prevent duplicates
    const existingTabListener = document.querySelector('[data-tab-listener]');
    if (existingTabListener) {
        existingTabListener.removeAttribute('data-tab-listener');
    }
    
    // Add tab click listeners
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            // Remove active class from all tabs
            document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.config-tab-content').forEach(content => content.style.display = 'none');
            
            // Add active class to clicked tab
            e.target.classList.add('active');
            const targetTab = document.getElementById(e.target.dataset.tab + '-tab');
            if (targetTab) {
                targetTab.style.display = 'block';
            }
        });
    });
    
    // Mark that listeners have been added
    document.body.setAttribute('data-tab-listener', 'true');
    
    // Show first tab by default
    const firstTab = document.querySelector('.config-tab');
    const firstTabContent = document.getElementById('basic-tab');
    if (firstTab && firstTabContent) {
        firstTab.classList.add('active');
        firstTabContent.style.display = 'block';
    }
    
    // Setup toggle JSON editor button
    const toggleJsonEditor = document.getElementById('toggleJsonEditor');
    if (toggleJsonEditor) {
        // Remove existing listener if any
        toggleJsonEditor.replaceWith(toggleJsonEditor.cloneNode(true));
        const newToggleBtn = document.getElementById('toggleJsonEditor');
        newToggleBtn.addEventListener('click', toggleConfigEditor);
    }
}

function setupConfigModalForUser() {
    const configFormEditor = document.getElementById('configFormEditor');
    const configJsonEditor = document.getElementById('configJsonEditor');
    const configReadOnly = document.getElementById('configReadOnly');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const toggleJsonEditor = document.getElementById('toggleJsonEditor');
    const superAdminNote = document.getElementById('superAdminNote');
    const adminNote = document.getElementById('adminNote');
    
    if (userRole.isSuperAdmin) {
        // Super admin can edit with form interface
        configFormEditor.style.display = 'block';
        configJsonEditor.style.display = 'none';
        configReadOnly.style.display = 'none';
        saveConfigBtn.style.display = 'inline-block';
        toggleJsonEditor.style.display = 'inline-block';
        superAdminNote.style.display = 'block';
        adminNote.style.display = 'none';
    } else {
        // Regular admin can only view
        configFormEditor.style.display = 'none';
        configJsonEditor.style.display = 'none';
        configReadOnly.style.display = 'block';
        saveConfigBtn.style.display = 'none';
        toggleJsonEditor.style.display = 'none';
        superAdminNote.style.display = 'none';
        adminNote.style.display = 'block';
    }
}

function hideConfigModal() {
    configModal.classList.remove('show');
}

// Load user role from server
async function loadUserRole() {
    try {
        const response = await fetch('/api/admin/user-role');
        userRole = await response.json();
    } catch (error) {
        console.error('Error loading user role:', error);
        userRole = { isAdmin: false, isSuperAdmin: false };
    }
}

// Setup UI permissions based on user role
function setupUIPermissions() {
    const configBtn = document.getElementById('configBtn');
    const downloadModalBtn = document.getElementById('downloadModalBtn');
    const userRoleIndicator = document.getElementById('userRoleIndicator');
    
    // Update role indicator
    if (userRole.isSuperAdmin) {
        userRoleIndicator.innerHTML = '👑 <strong>مدير أعلى</strong> - صلاحيات كاملة';
        userRoleIndicator.style.color = '#d4af37';
    } else if (userRole.isAdmin) {
        userRoleIndicator.innerHTML = '👤 <strong>مدير</strong> - إدارة الحجوزات';
        userRoleIndicator.style.color = '#2196F3';
    } else if (userRole.isViewer) {
        userRoleIndicator.innerHTML = '👁️ <strong>مشاهد</strong> - عرض الحجوزات فقط';
        userRoleIndicator.style.color = '#ff9800';
    }
    
    // Hide config button for non-super admins
    if (!userRole.isSuperAdmin) {
        configBtn.style.display = 'none';
    } else {
        configBtn.style.display = 'inline-block';
    }
    
    // Hide actions column for viewers
    const actionsHeader = document.getElementById('actionsHeader');
    if (userRole.isViewer && actionsHeader) {
        actionsHeader.style.display = 'none';
    }
    
    // Hide total revenue for viewers
    const revenueCard = document.getElementById('revenueCard');
    if (userRole.isViewer && revenueCard) {
        revenueCard.style.display = 'none';
    }
}

// Load configuration content and populate form
async function loadConfigContent() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        // Remove sensitive information before displaying
        const displayConfig = { ...config };
        delete displayConfig.adminPassword;
        delete displayConfig.superAdminPassword;
        
        // Format JSON with proper indentation
        const configText = JSON.stringify(displayConfig, null, 2);
        
        // Update read-only display
        const configContent = document.getElementById('configContent');
        if (configContent) {
            configContent.textContent = configText;
        }
        
        // Update JSON editor
        const configEditor = document.getElementById('configEditor');
        if (configEditor) {
            configEditor.value = configText;
        }
        
        // Populate form fields
        populateConfigForm(displayConfig);
        
    } catch (error) {
        console.error('Error loading config:', error);
        const errorText = 'خطأ في تحميل الإعدادات';
        const configContent = document.getElementById('configContent');
        if (configContent) {
            configContent.textContent = errorText;
        }
        const configEditor = document.getElementById('configEditor');
        if (configEditor) {
            configEditor.value = errorText;
        }
    }
}

// Populate form fields with config data
function populateConfigForm(config) {
    console.log('Populating config form with:', config);
    
    try {
        // Basic settings
        setValue('courtName', config.courtName);
        setValue('pricePerHour', config.pricePerHour);
        setValue('slotDurationMinutes', config.slotDurationMinutes);
        setValue('maxHoursPerPersonPerDay', config.maxHoursPerPersonPerDay);
        setValue('maxBookingDaysAhead', config.maxBookingDaysAhead);
        
        // Working hours
        setValue('openingStart', config.openingHours?.start);
        setValue('openingEnd', config.openingHours?.end);
        
        // Working days
        const workingDayCheckboxes = document.querySelectorAll('.working-day');
        workingDayCheckboxes.forEach(checkbox => {
            checkbox.checked = config.workingDays?.includes(checkbox.value);
        });
        
        // Features
        setCheckbox('enableOnlineBooking', config.features?.enableOnlineBooking);
        setCheckbox('requirePhoneVerification', config.features?.requirePhoneVerification);
        setCheckbox('allowCancellation', config.features?.allowCancellation);
        setValue('cancellationHours', config.features?.cancellationHours);
        setCheckbox('enableRecurringBooking', config.features?.enableRecurringBooking);
        setValue('maxRecurringWeeks', config.features?.maxRecurringWeeks);
        setCheckbox('requirePaymentConfirmation', config.features?.requirePaymentConfirmation);
        setValue('paymentTimeoutMinutes', config.features?.paymentTimeoutMinutes);
        
        // Payment info
        setValue('vodafoneCash', config.paymentInfo?.vodafoneCash);
        setValue('instaPay', config.paymentInfo?.instaPay);
        setValue('paymentInstructions', config.paymentInfo?.instructions);
        setValue('contactPhone', config.contactInfo?.phone);
        setValue('contactAddress', config.contactInfo?.address);
        setValue('contactEmail', config.contactInfo?.email);
        
        // UI settings
        setValue('headerTitle', config.ui?.headerTitle);
        setValue('headerSubtitle', config.ui?.headerSubtitle);
        setValue('heroTitle', config.ui?.heroTitle);
        setValue('heroSubtitle', config.ui?.heroSubtitle);
        setValue('primaryColor', config.ui?.primaryColor);
        setValue('theme', config.ui?.theme);
        
        console.log('Config form populated successfully');
    } catch (error) {
        console.error('Error populating config form:', error);
    }
}

// Helper function to set input value
function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.value = value;
        console.log(`Set ${id} = ${value}`);
    } else if (!element) {
        console.warn(`Element not found: ${id}`);
    }
}

// Helper function to set checkbox value
function setCheckbox(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.checked = value;
        console.log(`Set checkbox ${id} = ${value}`);
    } else if (!element) {
        console.warn(`Checkbox element not found: ${id}`);
    }
}

// Collect form data into config object
function collectConfigFormData() {
    const config = {};
    
    // Basic settings
    config.courtName = getValue('courtName');
    config.pricePerHour = parseInt(getValue('pricePerHour'));
    config.slotDurationMinutes = parseInt(getValue('slotDurationMinutes'));
    config.maxHoursPerPersonPerDay = parseInt(getValue('maxHoursPerPersonPerDay'));
    config.maxBookingDaysAhead = parseInt(getValue('maxBookingDaysAhead'));
    config.currency = "جنيه";
    
    // Working hours
    config.openingHours = {
        start: getValue('openingStart'),
        end: getValue('openingEnd')
    };
    
    // Working days
    const workingDays = [];
    document.querySelectorAll('.working-day:checked').forEach(checkbox => {
        workingDays.push(checkbox.value);
    });
    config.workingDays = workingDays;
    
    // Features
    config.features = {
        enableOnlineBooking: getCheckboxValue('enableOnlineBooking'),
        requirePhoneVerification: getCheckboxValue('requirePhoneVerification'),
        allowCancellation: getCheckboxValue('allowCancellation'),
        cancellationHours: parseInt(getValue('cancellationHours')),
        enableRecurringBooking: getCheckboxValue('enableRecurringBooking'),
        maxRecurringWeeks: parseInt(getValue('maxRecurringWeeks')),
        requirePaymentConfirmation: getCheckboxValue('requirePaymentConfirmation'),
        paymentTimeoutMinutes: parseInt(getValue('paymentTimeoutMinutes'))
    };
    
    // Payment info
    config.paymentInfo = {
        vodafoneCash: getValue('vodafoneCash'),
        instaPay: getValue('instaPay'),
        instructions: getValue('paymentInstructions')
    };
    
    // Contact info
    config.contactInfo = {
        phone: getValue('contactPhone'),
        address: getValue('contactAddress'),
        email: getValue('contactEmail')
    };
    
    // UI settings
    config.ui = {
        headerTitle: getValue('headerTitle'),
        headerSubtitle: getValue('headerSubtitle'),
        heroTitle: getValue('heroTitle'),
        heroSubtitle: getValue('heroSubtitle'),
        primaryColor: getValue('primaryColor'),
        theme: getValue('theme')
    };
    
    return config;
}

// Helper function to get input value
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

// Helper function to get checkbox value
function getCheckboxValue(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

// Toggle between form and JSON editor
function toggleConfigEditor() {
    const formEditor = document.getElementById('configFormEditor');
    const jsonEditor = document.getElementById('configJsonEditor');
    const toggleBtn = document.getElementById('toggleJsonEditor');
    
    if (formEditor.style.display === 'none') {
        // Switch to form editor
        formEditor.style.display = 'block';
        jsonEditor.style.display = 'none';
        toggleBtn.textContent = '📝 التبديل للمحرر المتقدم';
    } else {
        // Switch to JSON editor
        formEditor.style.display = 'none';
        jsonEditor.style.display = 'block';
        toggleBtn.textContent = '📋 التبديل للمحرر المبسط';
        
        // Update JSON editor with current form data
        const configData = collectConfigFormData();
        const configEditor = document.getElementById('configEditor');
        if (configEditor) {
            configEditor.value = JSON.stringify(configData, null, 2);
        }
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
            window.location.href = '/admin-login';
            return;
        }
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الحجوزات');
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
    const colspan = userRole.isViewer ? "9" : "10";
    
    if (bookings.length === 0) {
        bookingsTable.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 2rem;">
                    لا توجد حجوزات حتى الآن
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort bookings by status priority first, then by date and time (newest first)
    const sortedBookings = [...bookings].sort((a, b) => {
        // Define status priority: pending (1), confirmed (2), declined (3), expired (4)
        const getStatusPriority = (status) => {
            switch(status) {
                case 'pending': return 1;
                case 'confirmed': return 2;
                case 'declined': return 3;
                case 'expired': return 4;
                default: return 4;
            }
        };
        
        const statusA = getStatusPriority(a.status || 'confirmed');
        const statusB = getStatusPriority(b.status || 'confirmed');
        
        // First sort by status priority
        if (statusA !== statusB) {
            return statusA - statusB;
        }
        
        // If same status, sort by date and time (newest first)
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
    });
    
    bookingsTable.innerHTML = sortedBookings.map(booking => `
        <tr>
            <td style="font-weight: 600; color: var(--primary-color);">${booking.displayBookingNumber || booking.bookingNumber || booking.id}</td>
            <td>${booking.displayName || booking.name}</td>
            <td>
                <a href="tel:${booking.phone}" style="color: var(--primary-color); text-decoration: none;">
                    ${booking.phone}
                </a>
            </td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.time}</td>
            <td>${formatDuration(booking.duration)}</td>
            <td>${booking.price} جنيه</td>
            <td>
                <span class="status-badge status-${booking.status || 'confirmed'}">
                    ${getStatusText(booking.status || 'confirmed')}
                </span>
            </td>
            <td>${formatDateTime(booking.createdAt)}</td>
            ${!userRole.isViewer ? `
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-success btn-small" onclick="confirmBooking('${booking.bookingNumber}', 'confirm')" title="${booking.isRecurring ? `تأكيد جميع الأسابيع (${booking.totalWeeks})` : 'تأكيد الحجز'}">
                            ✅ تأكيد${booking.isRecurring ? ` جميع الأسابيع` : ''}
                        </button>
                        <button class="btn btn-warning btn-small" onclick="confirmBooking('${booking.bookingNumber}', 'decline', '${booking.id}')" title="${booking.isRecurring ? `رفض الأسبوع ${booking.weekNumber}/${booking.totalWeeks}` : 'رفض الحجز'}">
                            ❌ رفض${booking.isRecurring ? ` (${booking.weekNumber}/${booking.totalWeeks})` : ''}
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="showDeleteModal('${booking.id}')" title="حذف الحجز">
                        🗑️ حذف
                    </button>
                </div>
            </td>
            ` : ''}
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
            window.location.href = '/admin-login';
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
            window.location.href = '/admin-login';
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
            window.location.href = '/admin-login';
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
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin-login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin-login';
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

function formatDuration(durationInMinutes) {
    if (!durationInMinutes) return '30 دقيقة'; // Default fallback
    
    const minutes = parseInt(durationInMinutes);
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} ساعة`;
        } else {
            return `${hours} ساعة و ${remainingMinutes} دقيقة`;
        }
    } else {
        return `${minutes} دقيقة`;
    }
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
async function confirmBooking(bookingNumber, action, bookingId = null) {
    const actionText = action === 'confirm' ? 'تأكيد' : 'رفض';
    
    let confirmMessage;
    if (action === 'confirm' && !bookingId) {
        // Confirming all weeks of recurring booking
        confirmMessage = `هل أنت متأكد من ${actionText} جميع أسابيع هذا الحجز المتكرر؟`;
    } else if (action === 'decline' && bookingId) {
        // Declining specific week
        confirmMessage = `هل أنت متأكد من ${actionText} هذا الأسبوع من الحجز المتكرر؟`;
    } else {
        // Regular booking or decline all
        confirmMessage = `هل أنت متأكد من ${actionText} هذا الحجز؟`;
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const requestBody = {
            bookingNumber: bookingNumber,
            action: action
        };
        
        // If bookingId is provided, include it to update only that specific week
        if (bookingId) {
            requestBody.bookingId = bookingId;
        }
        
        const response = await fetch('/api/confirm-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
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

// Apply filter to bookings
async function applyFilter(filter, date = null) {
    try {
        currentFilter = filter;
        
        // Update filter button states
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (filter !== 'date') {
            const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
        
        // Load filtered bookings
        let endpoint = '/api/admin/bookings';
        let params = new URLSearchParams();
        
        if (filter !== 'all') {
            endpoint = '/api/admin/bookings/filter';
            params.append('filter', filter);
            
            if (filter === 'date' && date) {
                params.append('date', date);
            }
        }
        
        const url = params.toString() ? `${endpoint}?${params}` : endpoint;
        const response = await fetch(url);
        
        if (response.status === 401) {
            window.location.href = '/admin-login';
            return;
        }
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الحجوزات المفلترة');
        }
        
        bookings = await response.json();
        renderBookings();
        updateStatistics();
        updateFilterStatus(filter, date);
        
    } catch (error) {
        console.error('Error applying filter:', error);
        showMessage('خطأ في تطبيق التصفية', 'error');
    }
}

// Update filter status display
function updateFilterStatus(filter, date = null) {
    const filterStatus = document.getElementById('filterStatus');
    if (!filterStatus) return;
    
    let statusText = '';
    const count = bookings.length;
    
    switch(filter) {
        case 'all':
            statusText = `عرض جميع الحجوزات (${count})`;
            break;
        case 'today':
            statusText = `حجوزات اليوم (${count})`;
            break;
        case 'week':
            statusText = `حجوزات هذا الأسبوع (${count})`;
            break;
        case 'month':
            statusText = `حجوزات هذا الشهر (${count})`;
            break;
        case 'date':
            statusText = `حجوزات ${date} (${count})`;
            break;
    }
    
    filterStatus.textContent = statusText;
}

// Make functions globally accessible for inline HTML handlers
window.showDeleteModal = showDeleteModal;
window.confirmBooking = confirmBooking;
window.selectFormat = selectFormat;
window.applyFilter = applyFilter;
