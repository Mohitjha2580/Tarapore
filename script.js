// Main JavaScript for Tarapore School Student Engagement Platform

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    setupNavigation();
    setupLeaderboardTabs();
    setupAchievementFilters();
    setupTeacherModal();
    setupNotifications();
    setupProgressAnimations();
    setupInteractiveElements();
    initializeRealTimeUpdates();
}

// Navigation System
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Smooth scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Trigger entrance animations
                setTimeout(() => {
                    animateElements(targetSection);
                }, 100);
            }
        });
    });
}

// Leaderboard Tab System
function setupLeaderboardTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.leaderboard-tab');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding tab content
            const targetTab = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Animate leaderboard items
                setTimeout(() => {
                    animateLeaderboardItems(targetContent);
                }, 100);
            }
        });
    });
}

// Achievement Filter System
function setupAchievementFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const achievementCards = document.querySelectorAll('.achievement-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Filter achievement cards
            achievementCards.forEach(card => {
                if (filterValue === 'all' || card.classList.contains(filterValue)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Teacher Modal System
function setupTeacherModal() {
    const modal = document.getElementById('teacher-modal');
    const closeBtn = document.querySelector('.close');
    const awardButton = document.getElementById('award-points');
    
    // Open modal (you can add a button to trigger this)
    window.openTeacherModal = function() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };
    
    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Award points functionality
    if (awardButton) {
        awardButton.addEventListener('click', function() {
            const studentSelect = document.getElementById('student-select');
            const pointsInput = document.getElementById('points-input');
            const categorySelect = document.getElementById('category-select');
            
            const studentName = studentSelect.value;
            const points = parseInt(pointsInput.value);
            const category = categorySelect.value;
            
            if (points && points > 0) {
                // Award points logic here
                showAchievementNotification(
                    `${points} points awarded to ${studentName} for ${category}!`
                );
                
                // Update UI (simulated)
                updateStudentPoints(studentName, points);
                
                // Clear inputs
                pointsInput.value = '';
                
                // Close modal
                closeModal();
            } else {
                alert('Please enter a valid number of points.');
            }
        });
    }
}

// Notification System
function setupNotifications() {
    const notificationBell = document.querySelector('.notification-bell');
    
    if (notificationBell) {
        notificationBell.addEventListener('click', function() {
            showNotificationDropdown();
        });
    }
}

function showNotificationDropdown() {
    // Create notification dropdown if it doesn't exist
    let dropdown = document.querySelector('.notification-dropdown');
    if (!dropdown) {
        dropdown = createNotificationDropdown();
        document.body.appendChild(dropdown);
    }
    
    dropdown.classList.toggle('show');
}

function createNotificationDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.innerHTML = `
        <div class="notification-header">
            <h4>Notifications</h4>
            <span class="mark-all-read">Mark all as read</span>
        </div>
        <div class="notification-item unread">
            <div class="notification-icon">🏆</div>
            <div class="notification-content">
                <p><strong>Achievement Unlocked!</strong></p>
                <p>You earned the "Helper" badge for volunteer work.</p>
                <span class="notification-time">2 hours ago</span>
            </div>
        </div>
        <div class="notification-item unread">
            <div class="notification-icon">📚</div>
            <div class="notification-content">
                <p><strong>Assignment Reminder</strong></p>
                <p>Science Chapter 7 assignment due tomorrow.</p>
                <span class="notification-time">4 hours ago</span>
            </div>
        </div>
        <div class="notification-item">
            <div class="notification-icon">🎨</div>
            <div class="notification-content">
                <p><strong>Art Competition</strong></p>
                <p>Your painting was selected for the gallery!</p>
                <span class="notification-time">1 day ago</span>
            </div>
        </div>
    `;
    
    return dropdown;
}

// Achievement Notification System
function showAchievementNotification(message) {
    const popup = document.getElementById('achievement-notification');
    const messageElement = document.getElementById('achievement-text');
    
    if (popup && messageElement) {
        messageElement.textContent = message;
        popup.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            closeAchievement();
        }, 5000);
    }
}

function closeAchievement() {
    const popup = document.getElementById('achievement-notification');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Progress Bar Animations
function setupProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width;
                
                // Reset and animate
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.width = width;
                }, 100);
            }
        });
    }, observerOptions);
    
    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
}

// Interactive Elements
function setupInteractiveElements() {
    // Card hover effects
    const cards = document.querySelectorAll('.action-card, .achievement-card, .leaderboard-item, .timeline-content');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = this.style.transform || '';
            if (!this.style.transform.includes('scale')) {
                this.style.transform += ' scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = this.style.transform.replace(' scale(1.02)', '');
        });
    });
    
    // Button click effects
    const buttons = document.querySelectorAll('.action-btn, .tab-btn, .filter-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Add ripple effect
            createRippleEffect(this);
        });
    });
    
    // Daily challenges interaction
    setupDailyChallenges();
}

function createRippleEffect(element) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Daily Challenges System
function setupDailyChallenges() {
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.action-card');
            const title = card.querySelector('h4').textContent;
            
            // Simulate joining activity
            this.textContent = 'Joined!';
            this.style.background = 'var(--secondary-green)';
            this.disabled = true;
            
            // Show success message
            showAchievementNotification(`You joined: ${title}`);
            
            // Update progress if it's a progress-based challenge
            const progressBar = card.querySelector('.progress-fill');
            if (progressBar) {
                const currentWidth = parseInt(progressBar.style.width) || 0;
                const newWidth = Math.min(currentWidth + 20, 100);
                progressBar.style.width = newWidth + '%';
                
                const progressText = card.querySelector('.action-progress span');
                if (progressText) {
                    progressText.textContent = `${newWidth}% Complete`;
                }
            }
        });
    });
}

// Real-time Updates Simulation
function initializeRealTimeUpdates() {
    // Simulate real-time leaderboard updates
    setInterval(updateLeaderboard, 30000); // Every 30 seconds
    
    // Simulate notification updates
    setInterval(addRandomNotification, 60000); // Every minute
    
    // Update daily streak
    updateDailyStreak();
}

function updateLeaderboard() {
    const pointsElements = document.querySelectorAll('.points');
    
    pointsElements.forEach(element => {
        const currentPoints = parseInt(element.textContent.replace(' pts', ''));
        const randomIncrease = Math.floor(Math.random() * 5) + 1;
        const newPoints = currentPoints + randomIncrease;
        
        // Animate point increase
        animateNumberIncrease(element, currentPoints, newPoints);
    });
}

function animateNumberIncrease(element, startValue, endValue) {
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
        element.textContent = currentValue + ' pts';
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function addRandomNotification() {
    const notifications = [
        "🏆 Achievement unlocked: Consistent Learner!",
        "📚 New assignment posted in Mathematics",
        "🎨 Art competition entries due tomorrow",
        "🏃 Sports practice moved to 4 PM today",
        "🌟 You're in the top 10 this week!"
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    // Increase notification badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        
        // Add pulse animation
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'pulse 2s infinite';
        }, 10);
    }
    
    // Show toast notification
    showToastNotification(randomNotification);
}

function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-blue);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: 0 5px 20px var(--shadow);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
        max-width: 300px;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

function updateDailyStreak() {
    const streakElement = document.querySelector('.daily-streak span');
    if (streakElement) {
        // Simulate daily streak increment
        const currentStreak = parseInt(streakElement.textContent.split(' ')[0]);
        const lastUpdate = localStorage.getItem('lastStreakUpdate');
        const today = new Date().toDateString();
        
        if (lastUpdate !== today) {
            const newStreak = currentStreak + 1;
            streakElement.textContent = `${newStreak} Day Streak!`;
            localStorage.setItem('lastStreakUpdate', today);
            
            // Show celebration for streak milestones
            if (newStreak % 7 === 0) {
                showAchievementNotification(`🔥 Amazing! ${newStreak} day streak achieved!`);
            }
        }
    }
}

// Animation utilities
function animateElements(container) {
    const elements = container.querySelectorAll('.action-card, .achievement-card, .leaderboard-item, .timeline-item');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function animateLeaderboardItems(container) {
    const items = container.querySelectorAll('.leaderboard-item, .podium-place, .house-card');
    
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 150);
    });
}

// Update student points (for teacher dashboard)
function updateStudentPoints(studentName, points) {
    // Update the leaderboard
    const leaderboardItems = document.querySelectorAll('.leaderboard-item, .podium-student');
    
    leaderboardItems.forEach(item => {
        const nameElement = item.querySelector('h4');
        if (nameElement && nameElement.textContent === studentName) {
            const pointsElement = item.querySelector('.points, p');
            if (pointsElement) {
                const currentPoints = parseInt(pointsElement.textContent.replace(' pts', ''));
                const newPoints = currentPoints + points;
                pointsElement.textContent = newPoints + ' pts';
                
                // Add highlight effect
                item.style.background = 'rgba(39, 174, 96, 0.1)';
                setTimeout(() => {
                    item.style.background = '';
                }, 2000);
            }
        }
    });
}

// Add CSS for dynamic elements
const dynamicCSS = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .notification-dropdown {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        background: var(--neutral-white);
        border-radius: var(--border-radius);
        box-shadow: 0 10px 30px var(--shadow);
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
        overflow-y: auto;
    }
    
    .notification-dropdown.show {
        transform: translateX(0);
    }
    
    .notification-header {
        padding: 1rem;
        border-bottom: 1px solid var(--neutral-gray);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .mark-all-read {
        color: var(--primary-blue);
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .notification-item {
        padding: 1rem;
        border-bottom: 1px solid var(--neutral-gray);
        display: flex;
        gap: 0.75rem;
        transition: var(--transition);
    }
    
    .notification-item:hover {
        background: var(--neutral-light);
    }
    
    .notification-item.unread {
        background: rgba(52, 152, 219, 0.05);
        border-left: 3px solid var(--primary-blue);
    }
    
    .notification-icon {
        font-size: 1.2rem;
        margin-top: 0.2rem;
    }
    
    .notification-content p {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
    }
    
    .notification-time {
        font-size: 0.7rem;
        color: var(--text-light);
    }
    
    .toast-notification {
        font-family: 'Roboto', Arial, sans-serif;
    }
`;

// Add dynamic CSS to page
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicCSS;
document.head.appendChild(styleSheet);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        const modal = document.getElementById('teacher-modal');
        const achievementPopup = document.getElementById('achievement-notification');
        
        if (modal && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        if (achievementPopup && achievementPopup.style.display === 'block') {
            closeAchievement();
        }
    }
    
    // Number keys for quick navigation
    if (e.key >= '1' && e.key <= '5') {
        const navLinks = document.querySelectorAll('.nav-link');
        const index = parseInt(e.key) - 1;
        if (navLinks[index]) {
            navLinks[index].click();
        }
    }
});

// Add a floating teacher access button
function addTeacherAccessButton() {
    const teacherBtn = document.createElement('button');
    teacherBtn.innerHTML = '👨‍🏫';
    teacherBtn.title = 'Teacher Dashboard';
    teacherBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-purple), var(--primary-blue));
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 5px 20px var(--shadow);
        z-index: 1500;
        transition: var(--transition);
    `;
    
    teacherBtn.addEventListener('click', openTeacherModal);
    teacherBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    teacherBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(teacherBtn);
}

// Initialize teacher button
addTeacherAccessButton();

// Accessibility improvements
function setupAccessibility() {
    // Add focus indicators
    const focusableElements = document.querySelectorAll('button, a, input, select, [tabindex]');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--primary-blue)';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
}

// Initialize accessibility
setupAccessibility();

// Performance monitoring
function logPerformance() {
    if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`🚀 Tarapore School Platform loaded in ${loadTime}ms`);
    }
}

// Log performance on load
window.addEventListener('load', logPerformance);