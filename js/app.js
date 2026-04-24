/**
 * ===============================================================
 * SMART LMS - MAIN APPLICATION LOGIC (app.js)
 * ===============================================================
 * This file handles global functionalities like:
 * - Dark/Light mode toggle (persisted in localStorage)
 * - Sidebar navigation state
 * - Common UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Global Auth Check
    checkAuth();

    // Initialize the application
    initTheme();
    initSidebar();
    initGlobalSearch();
    updateGlobalProgress();
    initLogout();
});

/**
 * Initialize global search functionality
 */
function initGlobalSearch() {
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = globalSearch.value.trim();
                if (query) {
                    window.location.href = `/dashboard.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

/**
 * Check if the user is authorized to view the current page
 * Protected pages redirect to auth.html if not logged in.
 */
function checkAuth() {
    const path = window.location.pathname;
    const publicPages = ['/', '/index.html', '/auth.html'];
    const adminPages = ['/admin-dashboard.html'];
    
    // Check if current page is public
    const isPublicPage = publicPages.some(p => path === p || path.endsWith(p));
    const isAdminPage = adminPages.some(p => path === p || path.endsWith(p));
    
    const sessionStr = localStorage.getItem('lms-session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    
    if (!session && !isPublicPage) {
        // Redirect to login if trying to access protected page
        window.location.href = '/auth.html';
        return;
    }

    if (isAdminPage && (!session || (session.role !== 'admin' && session.email !== 'segunomole2@gmail.com'))) {
        // Redirect non-admins away from admin pages
        showNotification('Access Denied: Admins only!', 'error');
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1500);
        return;
    }

    // Security check for Editors accessing course player
    if (path.endsWith('course.html') && session && session.role === 'editor') {
        const activeCourseId = localStorage.getItem('lms-active-course');
        const storedCourses = localStorage.getItem('lms-courses');
        const courses = storedCourses ? JSON.parse(storedCourses) : [];
        const course = courses.find(c => c.id === activeCourseId);
        
        if (course && course.authorEmail !== session.email) {
            showNotification('Access Denied: You can only view courses you created.', 'error');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            return;
        }
    }

    // Update UI with user name if logged in
    if (session) {
        const userNameElements = document.querySelectorAll('.user-name-display');
        userNameElements.forEach(el => el.innerText = session.name);
        
        // Show admin/editor link in sidebar if applicable
        if (session.role === 'admin' || session.role === 'editor') {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !document.getElementById('management-nav-item')) {
                const managementItem = document.createElement('li');
                managementItem.id = 'management-nav-item';
                managementItem.className = 'nav-item';
                
                if (session.role === 'admin') {
                    managementItem.innerHTML = `<a href="/admin-dashboard.html" class="nav-link" style="color: var(--primary-color);">🛠️ Admin Panel</a>`;
                } else {
                    managementItem.innerHTML = `<a href="/editor-dashboard.html" class="nav-link" style="color: #10b981;">✍️ Editor Panel</a>`;
                }
                
                navLinks.appendChild(managementItem);
            }
        }
    }
}

/**
 * Initialize logout buttons across the app
 */
function initLogout() {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('lms-session');
            window.location.href = '/index.html';
        });
    });
}

/**
 * Initialize and handle Dark/Light mode toggle
 * This ensures the user's preference is saved and applied on every page load.
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const currentTheme = localStorage.getItem('lms-theme') || 'light';
    
    // Apply the saved theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const updateIcons = (theme) => {
        const icon = theme === 'dark' ? '🌙' : '☀️';
        if (themeToggle) {
            // If it's the sidebar button, keep the text
            if (themeToggle.classList.contains('w-full')) {
                themeToggle.innerHTML = `${icon} Toggle Theme`;
            } else {
                themeToggle.innerHTML = icon;
            }
        }
        if (themeToggleMobile) themeToggleMobile.innerHTML = icon;
    };

    updateIcons(currentTheme);
    
    const handleToggle = () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('lms-theme', newTheme);
        updateIcons(newTheme);
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', handleToggle);
    }
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', handleToggle);
    }
}

/**
 * Handle Sidebar responsiveness for mobile devices
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
}

/**
 * Update progress indicators across the app for the selected course
 */
function updateGlobalProgress() {
    const session = JSON.parse(localStorage.getItem('lms-session'));
    const progressSection = document.querySelector('.progress-overview');
    
    if (session && session.role !== 'user') {
        if (progressSection) progressSection.style.display = 'none';
        return;
    }

    const progressText = document.getElementById('global-progress-text');
    const progressBar = document.getElementById('global-progress-bar');
    
    // Default to course-1 if no course is explicitly selected
    const activeCourseId = localStorage.getItem('lms-active-course') || 'course-1';
    
    // Use the function from progress.js
    const percentage = typeof getCourseProgress === 'function' ? getCourseProgress(activeCourseId) : 0;
    
    if (progressText) progressText.innerText = `${percentage}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
}

/**
 * Utility function to format dates nicely
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

/**
 * Show a custom notification/toast
 * Since we avoid window.alert, we use this for user feedback.
 */
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    // Basic styling for the toast (can be moved to CSS)
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        zIndex: '1000',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'opacity 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
