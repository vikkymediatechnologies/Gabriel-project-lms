/**
 * ===============================================================
 * SMART LMS - AUTHENTICATION LOGIC (auth.js)
 * ===============================================================
 * This file handles:
 * - User registration (saving to localStorage)
 * - User login (verifying credentials)
 * - Session management (persisting login state)
 * - Access control (redirecting unauthenticated users)
 */

const MAIN_ADMIN_EMAIL = 'segunomole2@gmail.com';
const MAIN_ADMIN_NAME = 'Gabriel';
const MAIN_ADMIN_DEFAULT_PASSWORD = 'Admin@12345';

function getStoredUsers() {
    return JSON.parse(localStorage.getItem('lms-users')) || [];
}

function saveStoredUsers(users) {
    localStorage.setItem('lms-users', JSON.stringify(users));
}

function ensurePrimaryAdminAccount() {
    const users = getStoredUsers();
    const adminIndex = users.findIndex(user => user.email === MAIN_ADMIN_EMAIL);

    if (adminIndex === -1) {
        users.push({
            name: MAIN_ADMIN_NAME,
            email: MAIN_ADMIN_EMAIL,
            password: MAIN_ADMIN_DEFAULT_PASSWORD,
            role: 'admin'
        });
        saveStoredUsers(users);
        return;
    }

    const existingAdmin = users[adminIndex];
    users[adminIndex] = {
        ...existingAdmin,
        name: existingAdmin.name || MAIN_ADMIN_NAME,
        email: MAIN_ADMIN_EMAIL,
        password: existingAdmin.password || MAIN_ADMIN_DEFAULT_PASSWORD,
        role: 'admin'
    };
    saveStoredUsers(users);
}

document.addEventListener('DOMContentLoaded', () => {
    ensurePrimaryAdminAccount();

    // Handle Login/Register Toggle
    const toggleLogin = document.getElementById('toggle-login');
    const toggleRegister = document.getElementById('toggle-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (toggleLogin && toggleRegister) {
        toggleLogin.addEventListener('click', () => {
            toggleLogin.classList.add('active');
            toggleRegister.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        toggleRegister.addEventListener('click', () => {
            toggleRegister.classList.add('active');
            toggleLogin.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            // Check if user already exists
            const users = getStoredUsers();
            if (users.find(u => u.email === email)) {
                showNotification('User with this email already exists!', 'error');
                return;
            }

            // Save new user
            const role = email === 'segunomole2@gmail.com' ? 'admin' : 'user';
            
            users.push({ name, email, password, role });
            saveStoredUsers(users);

            showNotification(`Registration successful as ${role}! Please login.`, 'success');
            
            // Switch to login form
            toggleLogin.click();
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const users = getStoredUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Force admin role for the main administrator email
                if (user.email === MAIN_ADMIN_EMAIL) {
                    user.role = 'admin';
                    // Update the stored user data to persist the admin role
                    const userIndex = users.findIndex(u => u.email === user.email);
                    if (userIndex !== -1) {
                        users[userIndex].role = 'admin';
                        saveStoredUsers(users);
                    }
                }

                // Set session
                localStorage.setItem('lms-session', JSON.stringify({
                    name: user.name,
                    email: user.email,
                    role: user.role || 'user',
                    loginTime: new Date().getTime()
                }));

                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    if (user.role === 'admin') {
                        window.location.href = '/admin-dashboard.html';
                    } else if (user.role === 'editor') {
                        window.location.href = '/editor-dashboard.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1000);
            } else {
                showNotification('Invalid email or password!', 'error');
            }
        });
    }
});

/**
 * Check if the user is currently logged in
 */
function isLoggedIn() {
    return localStorage.getItem('lms-session') !== null;
}

/**
 * Get current user details
 */
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('lms-session'));
}

/**
 * Check if the user is an admin
 */
function isAdmin() {
    const session = getCurrentUser();
    return session && (session.role === 'admin' || session.email === MAIN_ADMIN_EMAIL);
}

/**
 * Log the user out and redirect to landing page
 */
function logout() {
    localStorage.removeItem('lms-session');
    window.location.href = '/index.html';
}
