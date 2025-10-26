// Home Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    function handleSearch() {
        const query = searchInput.value.trim();
        if (query) {
            console.log('Searching for:', query);
            // In a real app, this would trigger a search API call
            showNotification(`Searching for "${query}"...`, 'info');
        }
    }

    // Category navigation
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const category = button.dataset.category;
            console.log('Selected category:', category);
            
            // In a real app, this would filter the games
            showNotification(`Showing ${category} games`, 'info');
        });
    });

    // Category scroll navigation
    const navNextBtn = document.getElementById('navNextBtn');
    const categoryNav = document.querySelector('.category-nav');
    
    navNextBtn.addEventListener('click', () => {
        categoryNav.scrollBy({
            left: 200,
            behavior: 'smooth'
        });
    });

    // Section arrows
    const sectionArrows = document.querySelectorAll('.section-arrow');
    sectionArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const section = arrow.dataset.section;
            console.log('View more:', section);
            showNotification(`Loading more ${section} games...`, 'info');
        });
    });

    // Game card interactions
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking the play button
            if (!e.target.classList.contains('play-btn')) {
                console.log('Game card clicked');
            }
        });
    });

    // Play button handlers
    const playButtons = document.querySelectorAll('.play-btn');
    playButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameCard = button.closest('.game-card');
            const gameImage = gameCard.querySelector('.game-image');
            const gameName = gameImage.alt;
            
            console.log('Playing game:', gameName);
            showNotification(`Starting ${gameName}...`, 'success');
        });
    });

    // Hub item interactions
    const hubItems = document.querySelectorAll('.hub-item');
    hubItems.forEach(item => {
        item.addEventListener('click', () => {
            const hubName = item.querySelector('.hub-name').textContent;
            console.log('Hub clicked:', hubName);
            showNotification(`Opening ${hubName} community...`, 'info');
        });
    });

    // View more button
    const viewMoreBtn = document.querySelector('.view-more-btn');
    viewMoreBtn.addEventListener('click', () => {
        console.log('View more hubs');
        showNotification('Loading more communities...', 'info');
    });

    // User menu button
    const userMenuBtn = document.getElementById('userMenuBtn');
    userMenuBtn.addEventListener('click', () => {
        console.log('User menu clicked');
        // In a real app, this would open a user menu
        showNotification('User menu', 'info');
    });

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
            zIndex: '10000',
            animation: 'slideInNotification 0.3s ease-out',
            maxWidth: '350px'
        });

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Lazy loading for game images (optional enhancement)
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }

        // Escape to clear search
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            searchInput.blur();
        }
    });

    // Smooth scroll to top
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            // You can add a "back to top" button here if needed
        }, 100);
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
