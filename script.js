// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Modal handlers
    const signupModal = document.getElementById('signupModal');
    const openSignupBtn = document.getElementById('openSignupModal');
    const closeSignupBtn = document.getElementById('closeSignupModal');
    const switchToLoginBtn = document.getElementById('switchToLogin');

    // Open signup modal
    if (openSignupBtn) {
        openSignupBtn.addEventListener('click', () => {
            signupModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close signup modal
    if (closeSignupBtn) {
        closeSignupBtn.addEventListener('click', () => {
            signupModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Switch to login (close modal)
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking outside
    signupModal.addEventListener('click', (e) => {
        if (e.target === signupModal) {
            signupModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && signupModal.classList.contains('active')) {
            signupModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Form submission handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!username || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Simulate login process
        handleLogin(username, password);
    });

    // Handle login (you would replace this with actual authentication)
    function handleLogin(username, password) {
        // Add loading state
        const loginButton = loginForm.querySelector('.btn-login');
        const originalText = loginButton.innerHTML;
        loginButton.disabled = true;
        loginButton.innerHTML = '<span>Logging in...</span>';

        // Simulate API call
        setTimeout(() => {
            // Reset button
            loginButton.disabled = false;
            loginButton.innerHTML = originalText;

            // In a real application, you would make an API call here
            console.log('Login attempt:', { username, password: '***' });
            
            // Example success notification
            showNotification('Login successful!', 'success');
            
            // Redirect or handle successful login
            // window.location.href = '/dashboard';
        }, 1500);
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3',
            color: 'white',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: '1000',
            animation: 'slideIn 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add input validation feedback
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                input.style.borderColor = '#f44336';
            } else {
                input.style.borderColor = 'transparent';
            }
        });

        input.addEventListener('input', () => {
            if (input.style.borderColor === 'rgb(244, 67, 54)') {
                input.style.borderColor = 'transparent';
            }
        });
    });
});

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
