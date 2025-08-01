// Admin Login Script for GitHub Pages

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeButton = document.querySelector('.modal-close');

    // Admin password (same as in main script)
    const ADMIN_PASSWORD = "admin123";

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value.trim();
        
        if (password === ADMIN_PASSWORD) {
            // Store admin session
            sessionStorage.setItem('hagz_admin', 'true');
            // Redirect to admin panel
            window.location.href = 'admin.html';
        } else {
            showError('كلمة المرور غير صحيحة');
        }
    });

    // Modal functionality
    closeButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
});
