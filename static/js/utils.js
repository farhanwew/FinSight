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

// MODIFIED: showMessage function for toast notifications
export const showMessage = (message, type = 'info') => {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        console.error('Notification container not found. Make sure to add <div id="notification-container"> to index.html');
        alert(`${type.toUpperCase()}: ${message}`); // Fallback to alert
        return;
    }

    const notification = document.createElement('div');
    notification.className = `p-4 rounded-md shadow-lg mb-3 flex items-center space-x-3 transition-all duration-300 ease-in-out transform scale-95 opacity-0`;
    
    let bgColor, textColor, iconHtml;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            iconHtml = `<i data-lucide="check-circle" class="w-6 h-6"></i>`;
            break;
        case 'error':
            bgColor = 'bg-red-600';
            textColor = 'text-white';
            iconHtml = `<i data-lucide="x-circle" class="w-6 h-6"></i>`;
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-white';
            iconHtml = `<i data-lucide="alert-triangle" class="w-6 h-6"></i>`;
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            iconHtml = `<i data-lucide="info" class="w-6 h-6"></i>`;
            break;
    }

    notification.classList.add(bgColor, textColor);
    notification.innerHTML = `${iconHtml}<span>${message}</span>`;
    
    // Add to container and trigger fade-in
    notificationContainer.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('opacity-0', 'scale-95');
        notification.classList.add('opacity-100', 'scale-100');
        lucide.createIcons(); // Render lucide icons for the new notification
    }, 10); // Small delay to ensure transition works

    // Fade out and remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('opacity-100', 'scale-100');
        notification.classList.add('opacity-0', 'scale-95');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 4000);
};

export const getTimeAgo = (date) => {
    // Ensure we're working with a proper Date object
    const postDate = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(postDate.getTime())) {
        console.error('Invalid date provided to getTimeAgo:', date);
        return 'Waktu tidak valid';
    }
    
    const now = new Date();
    
    // Deteksi timezone pengguna secara dinamis
    // getTimezoneOffset() mengembalikan nilai dalam menit, negatif untuk timezone timur UTC
    // Perlu dikali -1 karena getTimezoneOffset() mengembalikan nilai negatif untuk UTC+
    const timezoneOffsetMinutes = -1 * now.getTimezoneOffset();
    const timezoneOffset = timezoneOffsetMinutes * 60 * 1000; // Konversi menit ke milidetik
    
    const adjustedPostDate = new Date(postDate.getTime() + timezoneOffset);
    
    // Calculate difference in milliseconds
    const diff = now - adjustedPostDate;
    
    // Handle case where date is very recent
    if (diff < 60000) { // If less than 1 minute
        return 'Baru saja';
    }
    
    // Calculate time units
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
    
    // Elements for analysis.js
    feasibilityForm: document.getElementById('feasibility-form'),
    feaModalInput: document.getElementById('fea-modal'),
    feaBiayaInput: document.getElementById('fea-biaya'),
    feaPemasukanInput: document.getElementById('fea-pemasukan'),
    feasibilityResult: document.getElementById('feasibility-result'),
    feasibilityOutput: document.getElementById('feasibility-output'),
    feasibilityStatusEl: document.getElementById('feasibility-status'),
    feaProfitEl: document.getElementById('fea-profit'),
    feaRoiEl: document.getElementById('fea-roi'),
    feaBepEl: document.getElementById('fea-bep'),
    breakEvenChartCanvas: document.getElementById('breakEvenChart'),
    feasibilityLoading: document.getElementById('feasibility-loading'),
    feasibilityAiInsightEl: document.getElementById('feasibility-ai-insight'),

    // Elements for predictions.js
    generatePredictionBtn: document.getElementById('generate-prediction-btn'),
    predictionResult: document.getElementById('prediction-result'),
    predictionLoading: document.getElementById('prediction-loading'),
    predictionOutput: document.getElementById('prediction-output'),
    predictedIncomeEl: document.getElementById('predicted-income'),
    predictedExpenseEl: document.getElementById('predicted-expense'),
    predictionInsightEl: document.getElementById('prediction-insight'),

    // Elements for recommendations.js
    recModalInput: document.getElementById('rec-modal'),
    recMinatInput: document.getElementById('rec-minat'),
    recLokasiInput: document.getElementById('rec-lokasi'),
    generateRecommendationBtn: document.getElementById('generate-recommendation-btn'),
    recommendationResult: document.getElementById('recommendation-result'),
    recommendationLoading: document.getElementById('recommendation-loading'),
    recommendationOutput: document.getElementById('recommendation-output'),
    recommendationCardsContainer: document.getElementById('recommendation-cards'),

    // Elements for transactions.js
    transactionForm: document.getElementById('transaction-form'),
    transactionTableBody: document.getElementById('transaction-table-body'),

    // Elements for dashboard.js
    totalPemasukanEl: document.getElementById('total-pemasukan'),
    totalPengeluaranEl: document.getElementById('total-pengeluaran'),
    saldoSaatIniEl: document.getElementById('saldo-saat-ini'),
    totalTransaksiEl: document.getElementById('total-transaksi'),

    // Elements for community.js
    communityPostForm: document.getElementById('community-post-form'),
    communityPostsContainer: document.getElementById('community-posts-container'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    createPostBtn: document.getElementById('create-post-btn'),
    createPostModal: document.getElementById('create-post-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelPostBtn: document.getElementById('cancel-post-btn'),

    // Elements for profile.js
    updateNameForm: document.getElementById('update-name-form'),
    changePasswordForm: document.getElementById('change-password-form'),
    currentNameInput: document.getElementById('current-name'),
    newNameInput: document.getElementById('new-name'),
    profileAvatar: document.getElementById('profile-avatar'),
};

export const showLogoutConfirmation = (onConfirm) => {
    const modal = document.getElementById('logout-confirmation-modal');
    const closeBtn = document.getElementById('close-logout-modal');
    const cancelBtn = document.getElementById('cancel-logout');
    const confirmBtn = document.getElementById('confirm-logout');
    
    const closeModal = () => {
        modal.classList.add('hidden');
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Set up the confirm button with a one-time event listener
    const confirmHandler = () => {
        closeModal();
        onConfirm();
        confirmBtn.removeEventListener('click', confirmHandler);
    };
    
    confirmBtn.addEventListener('click', confirmHandler);
    
    // Show the modal
    modal.classList.remove('hidden');
    
    // Re-render Lucide icons for the new modal content
    lucide.createIcons();
};