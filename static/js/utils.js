// static/js/utils.js
export const BASE_URL = window.env?.BASE_URL || "http://localhost:8000";
export let authToken = localStorage.getItem('finsight_token');
export let currentUserId = null;
export let currentUserName = null;
export let currentUserTransactions = [];
export let chartInstances = {}; // Untuk mengelola instance Chart.js

export const setAuthToken = (token) => {
    authToken = token;
    localStorage.setItem('finsight_token', token);
};

export const clearAuthToken = () => {
    authToken = null;
    localStorage.removeItem('finsight_token');
};

export const setCurrentUser = (id, name) => {
    currentUserId = id;
    currentUserName = name;
};

export const setCurrentUserTransactions = (transactions) => {
    currentUserTransactions = transactions;
};

export const getAuthHeaders = () => {
    if (!authToken) {
        console.error("No auth token available.");
        return {};
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
};

export const getAuthHeadersFormData = () => {
    if (!authToken) {
        console.error("No auth token available.");
        return {};
    }
    // For FormData, Content-Type is set automatically by the browser,
    // so we only need to provide Authorization.
    return {
        'Authorization': `Bearer ${authToken}`
    };
};

export const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export const destroyChart = (chartId) => {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
};

export const showMessage = (message, type = 'info') => {
    alert(`${type.toUpperCase()}: ${message}`); // Implementasikan toast/modal yang lebih canggih di sini
};

export const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return 'Baru saja';
};

export const getCategoryColor = (category) => {
    const colors = {
        achievement: 'bg-green-900/50 text-green-300',
        tips: 'bg-blue-900/50 text-blue-300',
        question: 'bg-yellow-900/50 text-yellow-300',
        story: 'bg-purple-900/50 text-purple-300'
    };
    return colors[category] || 'bg-slate-700 text-slate-300';
};

export const getCategoryLabel = (category) => {
    const labels = {
        achievement: 'Pencapaian',
        tips: 'Tips & Trik',
        question: 'Pertanyaan',
        story: 'Cerita Bisnis'
    };
    return labels[category] || category;
};

// Global DOM elements (for easier access across modules)
export const DOMElements = {
    authScreen: document.getElementById('auth-screen'),
    appScreen: document.getElementById('app-screen'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showRegisterBtn: document.getElementById('show-register-btn'),
    showLoginBtn: document.getElementById('show-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    navLinks: document.querySelectorAll('.nav-link'),
    pageContents: document.querySelectorAll('.page-content'),
    pageTitle: document.getElementById('page-title'),
    userNameDisplay: document.getElementById('user-name-display'),
    userAvatarDisplay: document.getElementById('user-avatar-display'),
    userProfileTrigger: document.getElementById('user-profile-trigger'),
    profileDropdown: document.getElementById('profile-dropdown'),
    profileMenuBtn: document.getElementById('profile-menu-btn'),
    logoutDropdownBtn: document.getElementById('logout-dropdown-btn'),
    // ... tambahkan elemen DOM lain yang sering diakses di sini
};