// static/js/auth.js
import { authAPI } from './api.js';
import { setAuthToken, clearAuthToken, showMessage, setCurrentUser, DOMElements } from './utils.js';
import { initApp, showAuth } from './app.js';

const loginForm = DOMElements.loginForm;
const registerForm = DOMElements.registerForm;
const showRegisterBtn = DOMElements.showRegisterBtn;
const showLoginBtn = DOMElements.showLoginBtn;

// Fungsi untuk validasi format email
const isValidEmail = (email) => {
    // Regex sederhana untuk validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const setupAuthListeners = () => {
    showRegisterBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        loginForm.classList.add('hidden'); 
        registerForm.classList.remove('hidden'); 
    });

    showLoginBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        registerForm.classList.add('hidden'); 
        loginForm.classList.remove('hidden'); 
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const email = emailInput.value;
        const password = passwordInput.value;

        // Validasi email
        if (!isValidEmail(email)) {
            showMessage('Format email tidak valid. Contoh: user@example.com', 'error');
            emailInput.focus();
            return; // Hentikan proses submit
        }

        try {
            const response = await authAPI.login(email, password);
            if (response.ok) {
                const data = await response.json();
                setAuthToken(data.access_token);
                showMessage('Login berhasil!', 'success');
                initApp(); // Panggil initApp() untuk beralih ke app-screen dan inisialisasi data
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Email atau password salah. Silakan coba lagi.', 'error');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showMessage('Terjadi kesalahan saat login. Server tidak merespons.', 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('register-name');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        // Validasi email
        if (!isValidEmail(email)) {
            showMessage('Format email tidak valid. Contoh: user@example.com', 'error');
            emailInput.focus();
            return; // Hentikan proses submit
        }
        
        // Validasi password (minimal 6 karakter)
        if (password.length < 6) {
            showMessage('Password minimal harus 6 karakter.', 'error');
            passwordInput.focus();
            return; // Hentikan proses submit
        }


        try {
            const response = await authAPI.register(name, email, password);
            if (response.ok) {
                const data = await response.json();
                setAuthToken(data.access_token);
                showMessage('Registrasi berhasil! Anda sudah login.', 'success');
                initApp(); // Panggil initApp() untuk beralih ke app-screen dan inisialisasi data
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Registrasi gagal. Email mungkin sudah terdaftar.', 'error');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            showMessage('Terjadi kesalahan saat registrasi. Server tidak merespons.', 'error');
        }
    });
};

export const handleLogout = () => {
    clearAuthToken();
    showAuth();
};