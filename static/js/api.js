// static/js/api.js
import { BASE_URL, getAuthHeaders, getAuthHeadersFormData } from './utils.js';

export const authAPI = {
    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return response;
    },
    register: async (name, email, password) => {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return response;
    },
    getUserInfo: async () => {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    },
    updateProfile: async (name) => {
        const response = await fetch(`${BASE_URL}/auth/update-profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        return response;
    },
    changePassword: async (currentPassword, newPassword) => {
        const response = await fetch(`${BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
        return response;
    }
};

export const transactionsAPI = {
    getTransactions: async () => {
        const response = await fetch(`${BASE_URL}/transactions`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    },
    createTransaction: async (transactionData) => {
        const response = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(transactionData)
        });
        return response;
    },
    deleteTransaction: async (id) => {
        const response = await fetch(`${BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response;
    }
};

export const dashboardAPI = {
    getSummary: async () => {
        const response = await fetch(`${BASE_URL}/dashboard/summary`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    }
};

export const predictionsAPI = {
    generateCashflow: async () => {
        const response = await fetch(`${BASE_URL}/predictions/cashflow`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response;
    }
};

export const recommendationsAPI = {
    generateBusinessRecommendations: async (modal, minat, lokasi) => {
        const response = await fetch(`${BASE_URL}/recommendations/business`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ modal, minat, lokasi })
        });
        return response;
    }
};

export const analysisAPI = {
    analyzeFeasibility: async (modalAwal, biayaOperasional, estimasiPemasukan, signal) => {
        const response = await fetch(`${BASE_URL}/analysis/feasibility?modal_awal=${modalAwal}&biaya_operasional=${biayaOperasional}&estimasi_pemasukan=${estimasiPemasukan}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            signal: signal
        });
        return response;
    }
};

export const communityAPI = {
    createPost: async (formData) => {
        const response = await fetch(`${BASE_URL}/community/posts`, {
            method: 'POST',
            headers: getAuthHeadersFormData(), // Gunakan headers untuk FormData
            body: formData
        });
        return response;
    },
    getPosts: async (category = '') => {
        const url = category ? `${BASE_URL}/community/posts?category=${category}` : `${BASE_URL}/community/posts`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    },
    toggleLike: async (postId) => {
        const response = await fetch(`${BASE_URL}/community/posts/${postId}/like`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response;
    },
    createComment: async (postId, content) => {
        const response = await fetch(`${BASE_URL}/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return response;
    },
    getComments: async (postId) => {
        const response = await fetch(`${BASE_URL}/community/posts/${postId}/comments`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    },
    deletePost: async (postId) => { // New function to delete a post
        const response = await fetch(`${BASE_URL}/community/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response;
    }
};

export const reportsAPI = {
    getFinancialReport: async (startDate, endDate) => {
        const response = await fetch(`${BASE_URL}/reports/financial?start_date=${startDate}&end_date=${endDate}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response;
    }
};