// Admin Panel Script for GitHub Pages with Firebase

// Check if user is authenticated
if (!sessionStorage.getItem('hagz_admin')) {
    window.location.href = 'admin-login.html';
}

let selectedFormat = '';
let bookingToDelete = null;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('hagz_admin');
        window.location.href = 'admin-login.html';
    });

    // Format selection
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedFormat = this.dataset.format;
            updateDownloadButton();
        });
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', function() {
        if (selectedFormat) {
            downloadReport(selectedFormat);
        }
    });

    // Date filters
    document.getElementById('startDate').addEventListener('change', updateDownloadButton);
    document.getElementById('endDate').addEventListener('change', updateDownloadButton);
    
    // Booking filter
    document.getElementById('filterDate').addEventListener('change', function() {
        loadBookingsTable(this.value);
    });
    
    document.getElementById('clearFilter').addEventListener('click', function() {
        document.getElementById('filterDate').value = '';
        loadBookingsTable();
    });

    // Modal handlers
    setupModalHandlers();
}

function setupModalHandlers() {
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

    // Confirm delete handlers
    document.getElementById('confirmDelete').addEventListener('click', async function() {
        if (bookingToDelete) {
            await deleteBookingHandler(bookingToDelete);
            document.getElementById('confirmModal').style.display = 'none';
            bookingToDelete = null;
        }
    });

    document.getElementById('cancelDelete').addEventListener('click', function() {
        document.getElementById('confirmModal').style.display = 'none';
        bookingToDelete = null;
    });
}

// Firebase Database functions
async function getBookings() {
    try {
        const snapshot = await bookingsCollection.get();
        const bookings = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            bookings.push({ 
                id: doc.id, 
                ...data,
                // Convert Firestore timestamp to date string if needed
                date: data.date || (data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : ''),
                timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
            });
        });
        return bookings;
    } catch (error) {
        console.error('Error getting bookings:', error);
        return [];
    }
}

async function deleteBookingFromDB(bookingId) {
    try {
        await bookingsCollection.doc(bookingId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting booking:', error);
        throw error;
    }
}

async function loadDashboard() {
    try {
        const bookings = await getBookings();
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate statistics
        const totalBookings = bookings.length;
        const todayBookings = bookings.filter(b => b.date === today).length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
        const todayRevenue = bookings
            .filter(b => b.date === today)
            .reduce((sum, b) => sum + (b.price || 0), 0);
        
        // Update statistics display
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('todayBookings').textContent = todayBookings;
        document.getElementById('totalRevenue').textContent = `${totalRevenue} ريال`;
        document.getElementById('todayRevenue').textContent = `${todayRevenue} ريال`;
        
        // Load bookings table
        await loadBookingsTable();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('خطأ في تحميل البيانات');
    }
}

async function loadBookingsTable(filterDate = '') {
    try {
        const bookings = await getBookings();
        const tbody = document.getElementById('bookingsTableBody');
        const noBookings = document.getElementById('noBookings');
        
        let filteredBookings = bookings;
        if (filterDate) {
            filteredBookings = bookings.filter(b => b.date === filterDate);
        }
        
        if (filteredBookings.length === 0) {
            tbody.innerHTML = '';
            noBookings.style.display = 'block';
            return;
        }
        
        noBookings.style.display = 'none';
        
        // Sort bookings by date and time (newest first)
        filteredBookings.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });
        
        tbody.innerHTML = filteredBookings.map(booking => {
            const bookingDate = new Date(booking.timestamp || booking.date);
            const formattedDate = formatArabicDate(booking.date);
            const formattedBookingDate = bookingDate.toLocaleDateString('ar-SA');
            
            return `
                <tr>
                    <td>${booking.id}</td>
                    <td>${booking.customerName || booking.name || ''}</td>
                    <td>${booking.customerPhone || booking.phone || ''}</td>
                    <td>${formattedDate}</td>
                    <td>${booking.time}</td>
                    <td>${booking.price || 50} ريال</td>
                    <td>${formattedBookingDate}</td>
                    <td>
                        <button class="delete-btn small" onclick="confirmDelete('${booking.id}')">
                            🗑️ حذف
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bookings table:', error);
        showError('خطأ في تحميل جدول الحجوزات');
    }
}

function confirmDelete(bookingId) {
    bookingToDelete = bookingId;
    document.getElementById('confirmModal').style.display = 'block';
}

async function deleteBookingHandler(bookingId) {
    try {
        await deleteBookingFromDB(bookingId);
        showSuccess('تم حذف الحجز بنجاح');
        await loadDashboard();
    } catch (error) {
        console.error('Error deleting booking:', error);
        showError('خطأ في حذف الحجز');
    }
}

function updateDownloadButton() {
    const downloadBtn = document.getElementById('downloadBtn');
    const hasFormat = selectedFormat !== '';
    
    downloadBtn.disabled = !hasFormat;
    downloadBtn.style.opacity = hasFormat ? '1' : '0.5';
}

async function getFilteredBookings() {
    const bookings = await getBookings();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let filteredBookings = [...bookings];
    
    if (startDate) {
        filteredBookings = filteredBookings.filter(b => b.date >= startDate);
    }
    
    if (endDate) {
        filteredBookings = filteredBookings.filter(b => b.date <= endDate);
    }
    
    return filteredBookings;
}

async function downloadReport(format) {
    try {
        const bookings = await getFilteredBookings();
        
        if (bookings.length === 0) {
            showError('لا توجد حجوزات في النطاق المحدد');
            return;
        }
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const dateRange = startDate && endDate ? `${startDate}_${endDate}` : 'all';
        const fileName = `bookings_report_${dateRange}`;
        
        switch (format) {
            case 'pdf':
                downloadPDF(bookings, fileName);
                break;
            case 'excel':
                downloadExcel(bookings, fileName);
                break;
            case 'csv':
                downloadCSV(bookings, fileName);
                break;
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showError('خطأ في إنشاء التقرير');
    }
}

function downloadPDF(bookings, fileName) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set font for Arabic text
        doc.setFont('helvetica');
        
        // Add title
        doc.setFontSize(20);
        doc.text('Football Court Bookings Report', 20, 20);
        
        // Add date range if specified
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            doc.setFontSize(12);
            doc.text(`Period: ${startDate} to ${endDate}`, 20, 35);
        }
        
        // Prepare table data
        const headers = ['ID', 'Name', 'Phone', 'Date', 'Time', 'Price (SAR)'];
        const data = bookings.map(booking => [
            booking.id,
            booking.customerName || booking.name || '',
            booking.customerPhone || booking.phone || '',
            booking.date,
            booking.time,
            booking.price || 50
        ]);
        
        // Add table
        doc.autoTable({
            head: [headers],
            body: data,
            startY: startDate && endDate ? 45 : 35,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Add summary
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 50), 0);
        
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(12);
        doc.text(`Total Bookings: ${totalBookings}`, 20, finalY);
        doc.text(`Total Revenue: ${totalRevenue} SAR`, 20, finalY + 10);
        
        // Add footer
        doc.setFontSize(8);
        doc.text('Generated by HagzYomi System', 20, doc.internal.pageSize.height - 10);
        
        doc.save(`${fileName}.pdf`);
        showSuccess('تم تحميل تقرير PDF بنجاح');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showError('خطأ في إنشاء ملف PDF');
    }
}

function downloadExcel(bookings, fileName) {
    try {
        // Prepare data for Excel
        const data = [
            ['Football Court Bookings Report'],
            [],
            ['ID', 'Name', 'Phone', 'Date', 'Time', 'Price (SAR)', 'Booking Date']
        ];
        
        bookings.forEach(booking => {
            const bookingDate = new Date(booking.timestamp || booking.date);
            data.push([
                booking.id,
                booking.customerName || booking.name || '',
                booking.customerPhone || booking.phone || '',
                booking.date,
                booking.time,
                booking.price || 50,
                bookingDate.toLocaleDateString('en-US')
            ]);
        });
        
        // Add summary
        data.push([]);
        data.push(['Summary']);
        data.push(['Total Bookings', bookings.length]);
        data.push(['Total Revenue (SAR)', bookings.reduce((sum, b) => sum + (b.price || 50), 0)]);
        
        // Create workbook
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
        
        // Download
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        showSuccess('تم تحميل تقرير Excel بنجاح');
        
    } catch (error) {
        console.error('Excel generation error:', error);
        showError('خطأ في إنشاء ملف Excel');
    }
}

function downloadCSV(bookings, fileName) {
    try {
        const headers = ['ID,Name,Phone,Date,Time,Price (SAR),Booking Date'];
        const rows = bookings.map(booking => {
            const bookingDate = new Date(booking.timestamp || booking.date);
            return [
                booking.id,
                `"${booking.customerName || booking.name || ''}"`,
                booking.customerPhone || booking.phone || '',
                booking.date,
                booking.time,
                booking.price || 50,
                bookingDate.toLocaleDateString('en-US')
            ].join(',');
        });
        
        const csvContent = [
            'Football Court Bookings Report',
            '',
            ...headers,
            ...rows,
            '',
            'Summary',
            `Total Bookings,${bookings.length}`,
            `Total Revenue (SAR),${bookings.reduce((sum, b) => sum + (b.price || 50), 0)}`
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('تم تحميل تقرير CSV بنجاح');
        
    } catch (error) {
        console.error('CSV generation error:', error);
        showError('خطأ في إنشاء ملف CSV');
    }
}

function formatArabicDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showSuccess(message) {
    const modal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.textContent = message;
    modal.style.display = 'block';
}

function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    modal.style.display = 'block';
}
