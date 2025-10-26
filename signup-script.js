// Signup Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    let selectedUserType = 'user';

    // User Type Toggle Handler
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update selected user type
            selectedUserType = button.dataset.type;
            
            console.log('Selected user type:', selectedUserType);
        });
    });

    // Form Submission Handler
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            userType: selectedUserType,
            termsAccepted: document.getElementById('terms').checked
        };

        // Validate form
        if (!validateForm(formData)) {
            return;
        }

        // Handle signup
        handleSignup(formData);
    });

    // Form Validation
    function validateForm(formData) {
        // Check if all fields are filled
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            showNotification('Please fill in all fields', 'error');
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        // Validate password length
        if (formData.password.length < 8) {
            showNotification('Password must be at least 8 characters long', 'error');
            return false;
        }

        // Check if terms are accepted
        if (!formData.termsAccepted) {
            showNotification('Please accept the Terms & Conditions', 'error');
            return false;
        }

        return true;
    }

    // Handle Signup
    function handleSignup(formData) {
        const joinButton = signupForm.querySelector('.btn-join');
        const originalHTML = joinButton.innerHTML;
        
        // Add loading state
        joinButton.disabled = true;
        joinButton.innerHTML = '<span>Creating account...</span>';

        // Simulate API call
        setTimeout(() => {
            // Reset button
            joinButton.disabled = false;
            joinButton.innerHTML = originalHTML;

            // In a real application, you would make an API call here
            console.log('Signup data:', {
                ...formData,
                password: '***' // Don't log actual password
            });

            // Show success message
            showNotification('Account created successfully!', 'success');

            // Close modal and reset form after success
            setTimeout(() => {
                const modal = document.getElementById('signupModal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
                signupForm.reset();
                
                // In a real app, redirect to dashboard
                // window.location.href = '/dashboard';
                console.log('Account created, modal closed');
            }, 1500);
        }, 2000);
    }

    // Input Validation Feedback
    const inputs = document.querySelectorAll('.signup-input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value.trim() === '' && input.hasAttribute('required')) {
                input.style.borderColor = '#f44336';
            } else if (input.type === 'email' && input.value.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    input.style.borderColor = '#f44336';
                } else {
                    input.style.borderColor = '#4caf50';
                }
            } else if (input.value.trim() !== '') {
                input.style.borderColor = '#4caf50';
            }
        });

        input.addEventListener('input', () => {
            if (input.style.borderColor === 'rgb(244, 67, 54)') {
                input.style.borderColor = '#e0e0e0';
            }
        });
    });

    // Password Strength Indicator
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const strength = checkPasswordStrength(passwordInput.value);
            updatePasswordStrength(strength);
        });
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        return strength;
    }

    function updatePasswordStrength(strength) {
        const input = document.getElementById('signupPassword');
        
        if (strength === 0) {
            input.style.borderColor = '#e0e0e0';
        } else if (strength <= 2) {
            input.style.borderColor = '#f44336';
        } else if (strength <= 3) {
            input.style.borderColor = '#ff9800';
        } else {
            input.style.borderColor = '#4caf50';
        }
    }

    // Notification System
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
            zIndex: '10000',
            animation: 'slideInNotification 0.3s ease-out',
            maxWidth: '350px'
        });

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Keyboard accessibility for checkbox
    const termsCheckbox = document.getElementById('terms');
    const checkboxLabel = document.querySelector('.checkbox-label');
    
    checkboxLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            termsCheckbox.checked = !termsCheckbox.checked;
        }
    });
});

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInNotification {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutNotification {
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
document.head.appendChild(notificationStyle);
