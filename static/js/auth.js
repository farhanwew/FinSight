// static/js/auth.js
import { authAPI } from './api.js';
import { setAuthToken, clearAuthToken, showMessage, setCurrentUser, DOMElements } from './utils.js';
import { initApp, showAuth } from './app.js'; // Hapus showApp dari import

const loginForm = DOMElements.loginForm;
const registerForm = DOMElements.registerForm;
const showRegisterBtn = DOMElements.showRegisterBtn;
const showLoginBtn = DOMElements.showLoginBtn;

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
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

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
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

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