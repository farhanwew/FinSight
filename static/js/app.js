// static/js/app.js
import { authToken, currentUserName, setCurrentUser, DOMElements, showLogoutConfirmation } from './utils.js';
import { setupAuthListeners, handleLogout } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { setupTransactionListeners, fetchTransactionsAndRefresh } from './transactions.js';
import { setupPredictionListeners } from './predictions.js';
import { setupRecommendationListeners } from './recommendations.js';
import { setupAnalysisListeners } from './analysis.js';
import { setupCommunityListeners, loadCommunityPosts } from './community.js';
import { setupProfileListeners, showProfilePage } from './profile.js';
import { authAPI } from './api.js';
import './financial-report.js'; // Import financial report module

// DOM Elements
const authScreen = DOMElements.authScreen;
const appScreen = DOMElements.appScreen;
const navLinks = DOMElements.navLinks;
const pageContents = DOMElements.pageContents;
const pageTitle = DOMElements.pageTitle;
const userNameDisplay = DOMElements.userNameDisplay;
const userAvatarDisplay = DOMElements.userAvatarDisplay;
const logoutBtn = DOMElements.logoutBtn;


// Core App Logic
export const switchPage = async (pageId) => {
    // Store current page in localStorage
    localStorage.setItem('lastActivePage', pageId);
    
    pageContents.forEach(page => page.classList.add('hidden'));
    const activePage = document.getElementById(`page-${pageId}`);
    if (activePage) activePage.classList.remove('hidden');

    navLinks.forEach(link => {
        link.classList.remove('active', 'bg-indigo-600');
        if (link.dataset.page === pageId) link.classList.add('active', 'bg-indigo-600');
    });

    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"] span`);
    if(activeLink) pageTitle.textContent = activeLink.textContent;
    
    // Perform actions specific to each page when switching
    if (pageId === 'dashboard') {
        await fetchTransactionsAndRefresh(); // Ensure latest transactions are loaded
        await renderDashboard();
    } else if (pageId === 'manajemen') {
        await fetchTransactionsAndRefresh();
    } else if (pageId === 'komunitas') {
        loadCommunityPosts();
    } else if (pageId === 'profile') {
        showProfilePage();
    }

    lucide.createIcons(); // Re-render Lucide icons on new page content
};

export const initApp = async () => {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    try {
        const response = await authAPI.getUserInfo();
        if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.id, userData.name);
            userNameDisplay.textContent = currentUserName;
            const initial = currentUserName.charAt(0).toUpperCase();
            userAvatarDisplay.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initial}`;
            
            // Initial data load for dashboard and transactions
            await fetchTransactionsAndRefresh();
            
            // Get last active page from localStorage or default to dashboard
            const lastPage = localStorage.getItem('lastActivePage') || 'dashboard';
            switchPage(lastPage);
        } else {
            console.error('Error fetching user info after auto-login, response not ok.');
            handleLogout(); // Force logout if token is invalid
        }
    } catch (error) {
        console.error('Error fetching user info (network/parsing):', error);
        handleLogout(); // Force logout on network/parsing errors
    } finally {
        lucide.createIcons();
    }
};

export const showAuth = () => {
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    DOMElements.loginForm.classList.remove('hidden');
    DOMElements.registerForm.classList.add('hidden');
    // Clear user-related state upon showing auth screen
    setCurrentUser(null, null);
    lucide.createIcons();
};

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    setupTransactionListeners();
    setupPredictionListeners();
    setupRecommendationListeners();
    setupAnalysisListeners();
    setupCommunityListeners();
    setupProfileListeners(switchPage, handleLogout); // Pass switchPage and handleLogout for profile page

    // Universal navigation link listener
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(e.currentTarget.dataset.page);
        });
    });

    // Logout button in sidebar
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogoutConfirmation(handleLogout);
    });

    // Auto-login if token exists
    if (authToken && authToken.trim() !== '') {
        console.log('Token found in localStorage, attempting auto-login...');
        initApp();
    } else {
        console.log('No valid token found, showing auth screen...');
        showAuth();
    }
});