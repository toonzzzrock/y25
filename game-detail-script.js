// Game Detail Page Script

document.addEventListener('DOMContentLoaded', () => {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value;
            if (query) {
                console.log('Searching for:', query);
                // Implement search functionality here
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value;
                if (query) {
                    console.log('Searching for:', query);
                    // Implement search functionality here
                }
            }
        });
    }

    // User menu button
    const userMenuBtn = document.getElementById('userMenuBtn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            console.log('User menu clicked');
            // Implement user menu dropdown here
        });
    }

    // Game action buttons
    const gameActionBtns = document.querySelectorAll('.game-action-btn');
    gameActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.textContent.trim().split('\n')[0];
            console.log('Game action:', action);
            
            switch(action) {
                case 'Play':
                    console.log('Starting game...');
                    // Launch game
                    break;
                case 'Workshop':
                    console.log('Opening workshop...');
                    // Open workshop
                    break;
                case 'Menu':
                    console.log('Opening menu...');
                    // Open menu
                    break;
                case 'Game Select':
                    console.log('Opening game select...');
                    // Open game select
                    break;
            }
        });
    });

    // Report button functionality
    const reportBtn = document.querySelector('.report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            console.log('Report button clicked');
            // Show report modal
        });
    }

    // Control buttons
    const controlBtns = document.querySelectorAll('.control-btn');
    controlBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index === 0) {
                console.log('Report dropdown opened');
            } else {
                console.log('More options menu opened');
            }
        });
    });

    // Screenshot hover effects
    const screenshots = document.querySelectorAll('.screenshot-item');
    screenshots.forEach(screenshot => {
        screenshot.addEventListener('click', () => {
            console.log('Screenshot clicked - could open lightbox');
            // Implement lightbox or fullscreen view
        });
    });

    // Review interactions
    const reviewItems = document.querySelectorAll('.review-item');
    reviewItems.forEach(review => {
        review.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(4px)';
        });
        
        review.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Smooth scroll for page sections
    const sections = document.querySelectorAll('[class*="-section"]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

// Function to handle game launch
function launchGame(gameName) {
    console.log('Launching game:', gameName);
    // Implement actual game launch logic
}

// Function to handle report submission
function submitReport(reportData) {
    console.log('Report submitted:', reportData);
    // Send report to backend
}

// Function to add review
function addReview(rating, text) {
    console.log('Review added:', { rating, text });
    // Send review to backend
}
