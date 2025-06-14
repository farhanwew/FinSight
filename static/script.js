document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS CACHING ---
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    const logoutBtn = document.getElementById('logout-btn');

    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');
    const userNameDisplay = document.getElementById('user-name-display');
    const userAvatarDisplay = document.getElementById('user-avatar-display');

    const totalPemasukanEl = document.getElementById('total-pemasukan');
    const totalPengeluaranEl = document.getElementById('total-pengeluaran');
    const saldoSaatIniEl = document.getElementById('saldo-saat-ini');
    const totalTransaksiEl = document.getElementById('total-transaksi');

    const transactionForm = document.getElementById('transaction-form');
    const transactionTableBody = document.getElementById('transaction-table-body');

    // Prediksi Arus Kas elements
    const generatePredictionBtn = document.getElementById('generate-prediction-btn');
    const predictionResult = document.getElementById('prediction-result');
    const predictionLoading = document.getElementById('prediction-loading');
    const predictionOutput = document.getElementById('prediction-output');
    const predictedIncomeEl = document.getElementById('predicted-income');
    const predictedExpenseEl = document.getElementById('predicted-expense');
    const predictionInsightEl = document.getElementById('prediction-insight');

    // Rekomendasi Usaha elements
    const recModalInput = document.getElementById('rec-modal');
    const recMinatInput = document.getElementById('rec-minat');
    const recLokasiInput = document.getElementById('rec-lokasi');
    const generateRecommendationBtn = document.getElementById('generate-recommendation-btn');
    const recommendationResult = document.getElementById('recommendation-result');
    const recommendationLoading = document.getElementById('recommendation-loading');
    const recommendationOutput = document.getElementById('recommendation-output');
    const recommendationCardsContainer = document.getElementById('recommendation-cards');

    // Analisis Kelayakan elements
    const feasibilityForm = document.getElementById('feasibility-form');
    const feaModalInput = document.getElementById('fea-modal');
    const feaBiayaInput = document.getElementById('fea-biaya');
    const feaPemasukanInput = document.getElementById('fea-pemasukan');
    const feasibilityResult = document.getElementById('feasibility-result');
    const feasibilityOutput = document.getElementById('feasibility-output');
    const feasibilityStatusEl = document.getElementById('feasibility-status');
    const feaProfitEl = document.getElementById('fea-profit');
    const feaRoiEl = document.getElementById('fea-roi');
    const feaBepEl = document.getElementById('fea-bep');
    const breakEvenChartCanvas = document.getElementById('breakEvenChart');
    const feaAiInsightEl = document.getElementById('fea-ai-insight');
    // Analisis Kelayakan elements
    // ... (elemen yang sudah ada)
    const feasibilityLoading = document.getElementById('feasibility-loading'); // <<< TAMBAHKAN INI
    const feasibilityAiInsightEl = document.getElementById('feasibility-ai-insight'); // <<< TAMBAHKAN INI // Tambah elemen baru untuk AI Insight


    // Add these elements to DOM ELEMENTS CACHING section
const userProfileTrigger = document.getElementById('user-profile-trigger');
const profileDropdown = document.getElementById('profile-dropdown');
const profileMenuBtn = document.getElementById('profile-menu-btn');
const logoutDropdownBtn = document.getElementById('logout-dropdown-btn');

const updateNameForm = document.getElementById('update-name-form');
const changePasswordForm = document.getElementById('change-password-form');
const currentNameInput = document.getElementById('current-name');
const newNameInput = document.getElementById('new-name');
const profileAvatar = document.getElementById('profile-avatar');


    // --- DATA & STATE MANAGEMENT ---
    // BASE_URL untuk API backend
   const BASE_URL = window.env?.BASE_URL || "http://localhost:8000";
    let authToken = localStorage.getItem('finsight_token'); // Ambil dari localStorage
    let currentUserId = null; // ID pengguna saat ini
    let currentUserName = null; // Nama pengguna saat ini
    let currentUserTransactions = []; // Transaksi pengguna saat ini

    let chartInstances = {}; // Untuk mengelola instance Chart.js

    // --- UTILITY FUNCTIONS ---
    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const destroyChart = (chartId) => {
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
            delete chartInstances[chartId];
        }
    };

    // Fungsi untuk membuat header otorisasi
    const getAuthHeaders = () => {
        if (!authToken) {
            console.error("No auth token available.");
            return {};
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    };

    // Fungsi untuk menampilkan pesan (alert sederhana, bisa diganti dengan toast/modal yang lebih canggih)
    const showMessage = (message, type = 'info') => {
        alert(`${type.toUpperCase()}: ${message}`);
    };

    // Fungsi untuk menyimpan token
    const saveAuthToken = (token) => {
        authToken = token;
        localStorage.setItem('finsight_token', token);
    };

    // Fungsi untuk menghapus token
    const clearAuthToken = () => {
        authToken = null;
        localStorage.removeItem('finsight_token');
    };

    // Tambahkan fungsi untuk handle unauthorized response
const handleUnauthorized = () => {
    clearAuthToken();
    showMessage('Sesi berakhir. Silakan login kembali.', 'error');
    showAuth();
};

    // --- AUTHENTICATION LOGIC ---
    const showApp = async () => {
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');

        // Panggil API untuk mendapatkan info pengguna
        try {
            const response = await fetch(`${BASE_URL}/auth/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const userData = await response.json();
                currentUserId = userData.id;
                currentUserName = userData.name;
                userNameDisplay.textContent = currentUserName;
                const initial = currentUserName.charAt(0).toUpperCase();
                userAvatarDisplay.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initial}`;
                
                // Setelah login, muat data dashboard dan transaksi
                await fetchTransactions();
                await renderDashboard();
                switchPage('dashboard');
            } else {
                // Token mungkin kadaluarsa atau tidak valid
                showMessage('Sesi berakhir. Silakan login kembali.', 'error');
                clearAuthToken(); // Hapus token yang tidak valid
                showAuth();
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            showMessage('Gagal memuat info pengguna. Silakan coba lagi.', 'error');
            clearAuthToken();
            showAuth();
        } finally {
             lucide.createIcons();
        }
    };

    const showAuth = () => {
        appScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        clearAuthToken(); // Hapus token saat logout
        currentUserId = null;
        currentUserName = null;
        currentUserTransactions = [];
        lucide.createIcons();
    };

    // --- CORE APP LOGIC ---
    const switchPage = (pageId) => {
        pageContents.forEach(page => page.classList.add('hidden'));
        const activePage = document.getElementById(`page-${pageId}`);
        if (activePage) activePage.classList.remove('hidden');

        navLinks.forEach(link => {
            link.classList.remove('active', 'bg-indigo-600');
            if (link.dataset.page === pageId) link.classList.add('active', 'bg-indigo-600');
        });

        const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"] span`);
        if(activeLink) pageTitle.textContent = activeLink.textContent;
        
        lucide.createIcons();
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`${BASE_URL}/transactions`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            
            if (response.ok) {
                currentUserTransactions = await response.json();
            } else {
                showMessage('Gagal memuat transaksi.', 'error');
                currentUserTransactions = []; // Reset jika gagal
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showMessage('Terjadi kesalahan saat memuat transaksi.', 'error');
            currentUserTransactions = [];
        }
    };


    const renderTransactionTable = () => {
        transactionTableBody.innerHTML = '';

        if (!currentUserTransactions || currentUserTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="p-4 text-center text-slate-400">Belum ada transaksi. Silakan tambahkan transaksi baru.</td>`;
            transactionTableBody.appendChild(row);
            return;
        }

        currentUserTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(tx => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-700 hover:bg-slate-700/50';
                row.innerHTML = `
                    <td class="p-3">${tx.date}</td>
                    <td class="p-3">${tx.description || ''}</td>
                    <td class="p-3"><span class="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-1 rounded-full">${tx.category}</span></td>
                    <td class="p-3 text-right font-medium ${tx.type === 'pemasukan' ? 'text-green-400' : 'text-red-400'}">
                        ${tx.type === 'pemasukan' ? '+' : '-'} ${formatCurrency(tx.amount)}
                    </td>
                    <td class="p-3 text-center">
                        <button class="text-red-400 hover:text-red-600 delete-tx-btn" data-id="${tx.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                        </button>
                    </td>
                `;
                transactionTableBody.appendChild(row);
            });
        lucide.createIcons();
    };

    const deleteTransaction = async (id) => {
        const isConfirmed = confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
        if (isConfirmed) {
            try {
                const response = await fetch(`${BASE_URL}/transactions/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    showMessage('Transaksi berhasil dihapus!', 'success');
                    await fetchTransactions(); // Muat ulang transaksi
                    renderDashboard();
                    renderTransactionTable();
                } else {
                    showMessage('Gagal menghapus transaksi.', 'error');
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showMessage('Terjadi kesalahan saat menghapus transaksi.', 'error');
            }
        }
    };

    const renderDashboard = async () => {
        try {
            const response = await fetch(`${BASE_URL}/dashboard/summary`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const summary = await response.json();
                totalPemasukanEl.textContent = formatCurrency(summary.total_pemasukan);
                totalPengeluaranEl.textContent = formatCurrency(summary.total_pengeluaran);
                saldoSaatIniEl.textContent = formatCurrency(summary.saldo_saat_ini);
                totalTransaksiEl.textContent = summary.total_transaksi_bulan_ini;
            } else {
                showMessage('Gagal memuat ringkasan dashboard.', 'error');
            }
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            showMessage('Terjadi kesalahan saat memuat ringkasan dashboard.', 'error');
        }
        
        renderCashflowChart();
        renderCategoryPieChart('categoryPieChartDashboard');
    };

    // --- CHART RENDERING ---
    const renderCashflowChart = () => {
        destroyChart('cashflowChart'); 
        const ctx = document.getElementById('cashflowChart').getContext('2d');
        if (!currentUserTransactions || currentUserTransactions.length === 0) {
             ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
             ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
             ctx.textAlign = 'center';
             ctx.fillText('Data tidak tersedia untuk ditampilkan.', ctx.canvas.width / 2, ctx.canvas.height / 2);
             return;
        }

        const labels = [];
        const incomeData = Array(6).fill(0);
        const expenseData = Array(6).fill(0);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            labels.push(monthNames[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2)); // Ex: Mei 25
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0,0,0,0);

        const relevantTransactions = currentUserTransactions.filter(tx => new Date(tx.date) >= sixMonthsAgo);

        relevantTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const monthDiff = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());
            
            const index = 5 - monthDiff;

            if (index >= 0 && index < 6) {
                if (tx.type === 'pemasukan') {
                    incomeData[index] += tx.amount;
                } else {
                    expenseData[index] += tx.amount;
                }
            }
        });

        chartInstances['cashflowChart'] = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [ 
                    { label: 'Pemasukan', data: incomeData, backgroundColor: '#22c55e', borderRadius: 5 }, 
                    { label: 'Pengeluaran', data: expenseData, backgroundColor: '#ef4444', borderRadius: 5 } 
                ] 
            }, 
            options: { 
                responsive: true, 
                plugins: { legend: { labels: { color: '#cbd5e1' } } }, 
                scales: { 
                    y: { 
                        ticks: { color: '#94a3b8', callback: function(value) { return formatCurrency(value); } }, 
                        grid: { color: 'rgba(148, 163, 184, 0.2)' } 
                    }, 
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } } 
                } 
            } 
        });
    };

    const renderCategoryPieChart = (canvasId) => {
        destroyChart(canvasId); 
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const expenseCategories = (currentUserTransactions || [])
            .filter(t => t.type === 'pengeluaran')
            .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

        if (Object.keys(expenseCategories).length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Tidak ada data pengeluaran.', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        chartInstances[canvasId] = new Chart(ctx, { 
            type: 'doughnut', 
            data: { 
                labels: Object.keys(expenseCategories), 
                datasets: [{ 
                    data: Object.values(expenseCategories), 
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#3b82f6', '#8b5cf6'], 
                    borderColor: '#1e293b', 
                    borderWidth: 4 
                }] 
            }, 
            options: { 
                responsive: true, 
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += formatCurrency(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                } 
            } 
        });
    };

    // Fungsi untuk render chart break-even
    const renderBreakEvenChart = (breakEvenMonths) => {
        destroyChart('breakEvenChart');
        const ctx = breakEvenChartCanvas.getContext('2d');

        // Jika breakEvenMonths adalah null atau 0, kita tidak perlu menggambar grafik atau menampilkannya secara berbeda.
        // Cek juga jika profit_bersih_per_bulan adalah 0 atau negatif, agar grafik tidak menampilkan data yang tidak masuk akal.
        const modalAwal = parseFloat(feaModalInput.value);
        const profitBersihPerBulan = parseFloat(feaPemasukanInput.value) - parseFloat(feaBiayaInput.value);
        
        if (breakEvenMonths === null || breakEvenMonths <= 0 || profitBersihPerBulan <= 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Grafik tidak tersedia (defisit atau balik modal tidak tercapai).', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        // Batasi jumlah bulan yang ditampilkan agar grafik tidak terlalu panjang
        const numMonthsToShow = Math.ceil(breakEvenMonths) + 3;
        const labels = Array.from({length: numMonthsToShow > 20 ? 20 : numMonthsToShow}, (_, i) => `Bulan ${i + 1}`); // Batasi hingga 20 bulan jika terlalu panjang


        const cumulativeProfit = labels.map((_, i) => (i + 1) * profitBersihPerBulan);
        const breakEvenLine = labels.map(() => modalAwal);
        const netCumulative = labels.map((_, i) => ((i + 1) * profitBersihPerBulan) - modalAwal);

        chartInstances['breakEvenChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Modal Awal',
                        data: breakEvenLine,
                        borderColor: '#eab308',
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Profit Kumulatif',
                        data: cumulativeProfit,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 5,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: '#1e293b'
                    },
                    {
                        label: 'Net Kumulatif (Profit - Modal)',
                        data: netCumulative,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        hidden: true // Sembunyikan secara default
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    };


    // --- EVENT LISTENERS ---
    showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); });
    showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });

    // AUTH LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                saveAuthToken(data.access_token); // Simpan token
                showMessage('Login berhasil!', 'success');
                showApp();
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Email atau password salah. Silakan coba lagi.', 'error');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showMessage('Terjadi kesalahan saat login. Server tidak merespons.', 'error');
        }
    });

    // AUTH REGISTER
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                const data = await response.json();
                saveAuthToken(data.access_token); // Simpan token
                showMessage('Registrasi berhasil! Anda sudah login.', 'success');
                showApp();
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Registrasi gagal. Email mungkin sudah terdaftar.', 'error');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            showMessage('Terjadi kesalahan saat registrasi. Server tidak merespons.', 'error');
        }
    });

    logoutBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        clearAuthToken(); // Hapus token saat logout
        showAuth(); 
    });
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchPage(e.currentTarget.dataset.page); }); });
    
    // TRANSACTION FORM SUBMISSION
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const newTx = { 
            date: document.getElementById('tx-date').value, 
            type: document.getElementById('tx-type').value, 
            amount: parseFloat(document.getElementById('tx-amount').value), 
            category: document.getElementById('tx-category').value, 
            description: document.getElementById('tx-description').value, 
        }; 
        
        try {
            const response = await fetch(`${BASE_URL}/transactions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newTx)
            });

            if (response.ok) {
                showMessage('Transaksi berhasil disimpan!', 'success');
                await fetchTransactions(); // Muat ulang transaksi
                renderDashboard();
                renderTransactionTable();
                transactionForm.reset(); 
                document.getElementById('tx-date').value = new Date().toISOString().split('T')[0]; // Set tanggal ke hari ini
                // switchPage('manajemen'); // Tetap di halaman manajemen setelah submit
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Gagal menyimpan transaksi.', 'error');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            showMessage('Terjadi kesalahan saat menyimpan transaksi.', 'error');
        }
    });

    transactionTableBody.addEventListener('click', (e) => { 
        const deleteButton = e.target.closest('.delete-tx-btn'); 
        if (deleteButton) { 
            deleteTransaction(parseInt(deleteButton.dataset.id, 10)); 
        } 
    });

    // --- PREDIKSI ARUS KAS LOGIC ---
    generatePredictionBtn.addEventListener('click', async () => {
        predictionResult.classList.remove('hidden');
        predictionLoading.classList.remove('hidden');
        predictionOutput.classList.add('hidden');

        try {
            const response = await fetch(`${BASE_URL}/predictions/cashflow`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                predictedIncomeEl.textContent = formatCurrency(data.predicted_income);
                predictedExpenseEl.textContent = formatCurrency(data.predicted_expense);
                predictionInsightEl.textContent = data.insight;
                
                predictionLoading.classList.add('hidden');
                predictionOutput.classList.remove('hidden');
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Gagal membuat prediksi arus kas.', 'error');
                predictionResult.classList.add('hidden'); // Sembunyikan hasil jika gagal
            }
        } catch (error) {
            console.error('Error generating cashflow prediction:', error);
            showMessage('Terjadi kesalahan saat membuat prediksi arus kas. Pastikan ada cukup data transaksi.', 'error');
            predictionResult.classList.add('hidden');
        }
        lucide.createIcons();
    });

    // --- REKOMENDASI USAHA LOGIC ---
    generateRecommendationBtn.addEventListener('click', async () => {
        recommendationResult.classList.remove('hidden');
        recommendationLoading.classList.remove('hidden');
        recommendationOutput.classList.add('hidden');
        recommendationCardsContainer.innerHTML = ''; // Bersihkan kartu rekomendasi sebelumnya

        const modal = parseFloat(recModalInput.value);
        const minat = recMinatInput.value;
        const lokasi = recLokasiInput.value;

        try {
            const response = await fetch(`${BASE_URL}/recommendations/business`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ modal, minat, lokasi })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.recommendations && data.recommendations.length > 0) {
                    data.recommendations.forEach(rec => {
                        const card = document.createElement('div');
                        card.className = 'bg-slate-700 p-5 rounded-lg shadow-md border border-indigo-700';
                        card.innerHTML = `
                            <h5 class="font-bold text-lg text-indigo-300 mb-2">${rec.nama}</h5>
                            <p class="text-slate-300 text-sm mb-3">${rec.deskripsi}</p>
                            <div class="space-y-1 text-sm">
                                <p><span class="font-semibold text-slate-400">Modal:</span> ${formatCurrency(rec.modal_dibutuhkan)}</p>
                                <p><span class="font-semibold text-slate-400">Keuntungan:</span> ${rec.potensi_keuntungan}</p>
                                <p><span class="font-semibold text-slate-400">Risiko:</span> <span class="bg-slate-800 text-xs px-2 py-0.5 rounded-full ${rec.tingkat_risiko === 'Rendah' ? 'text-green-400' : rec.tingkat_risiko === 'Sedang' ? 'text-yellow-400' : 'text-red-400'}">${rec.tingkat_risiko}</span></p>
                            </div>
                        `;
                        recommendationCardsContainer.appendChild(card);
                    });
                    recommendationLoading.classList.add('hidden');
                    recommendationOutput.classList.remove('hidden');
                } else {
                    showMessage('Tidak ada rekomendasi usaha yang ditemukan dengan kriteria tersebut.', 'info');
                    recommendationResult.classList.add('hidden');
                }
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Gagal mendapatkan rekomendasi usaha.', 'error');
                recommendationResult.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error generating business recommendation:', error);
            showMessage('Terjadi kesalahan saat mendapatkan rekomendasi usaha.', 'error');
            recommendationResult.classList.add('hidden');
        }
    });

    // Tambahkan variabel untuk mengelola request
    let feasibilityAbortController = null; // Untuk membatalkan request sebelumnya

    // --- ANALISIS KELAYAKAN USAHA LOGIC ---
    feasibilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modalAwal = parseFloat(feaModalInput.value);
        const biayaOperasional = parseFloat(feaBiayaInput.value);
        const estimasiPemasukan = parseFloat(feaPemasukanInput.value);

        if (isNaN(modalAwal) || isNaN(biayaOperasional) || isNaN(estimasiPemasukan)) {
            showMessage('Mohon masukkan semua nilai numerik yang valid untuk analisis kelayakan.', 'warning');
            return;
        }

        // Batalkan request sebelumnya jika ada
        if (feasibilityAbortController) {
            feasibilityAbortController.abort();
        }

        // Buat controller baru untuk request ini
        feasibilityAbortController = new AbortController();

        // Tampilkan loading state
        feasibilityResult.classList.remove('hidden');
        feasibilityLoading.classList.remove('hidden');
        feasibilityOutput.classList.add('hidden');

        try {
            const response = await fetch(`${BASE_URL}/analysis/feasibility?modal_awal=${modalAwal}&biaya_operasional=${biayaOperasional}&estimasi_pemasukan=${estimasiPemasukan}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                signal: feasibilityAbortController.signal // Tambahkan signal untuk abort
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Feasibility Analysis Data Received:', data);

                // Sembunyikan loading dan tampilkan hasil
                feasibilityLoading.classList.add('hidden');
                feasibilityOutput.classList.remove('hidden');

                feaProfitEl.textContent = formatCurrency(data.profit_bersih);
                feaRoiEl.textContent = data.roi !== null && data.roi !== undefined ? `${data.roi.toFixed(2)}%` : 'N/A';
                
                let bepText;
                if (data.break_even_months === null || data.break_even_months === Infinity) {
                    bepText = 'Tidak tercapai (Defisit)';
                    feasibilityStatusEl.className = 'p-4 rounded-md font-bold text-center text-lg bg-red-900/50 text-red-300 border border-red-500';
                } else {
                    bepText = `${data.break_even_months.toFixed(1)} Bulan`;
                    if (data.feasibility_status === 'Layak') {
                         feasibilityStatusEl.className = 'p-4 rounded-md font-bold text-center text-lg bg-green-900/50 text-green-300 border border-green-500';
                    } else {
                         feasibilityStatusEl.className = 'p-4 rounded-md font-bold text-center text-lg bg-yellow-900/50 text-yellow-300 border border-yellow-500';
                    }
                }
                feaBepEl.textContent = bepText;
                feasibilityStatusEl.textContent = `Status: ${data.feasibility_status}`;
                
                // Update AI insight ke DOM
                if (feasibilityAiInsightEl && data.ai_insight) {
                    feasibilityAiInsightEl.textContent = data.ai_insight;
                }
                
                renderBreakEvenChart(data.break_even_months);

            } else {
                const errorData = await response.json();
                console.error('Feasibility Analysis API Error:', errorData);
                showMessage(errorData.detail || 'Gagal melakukan analisis kelayakan.', 'error');
                feasibilityResult.classList.add('hidden');
            }
        } catch (error) {
            // Jangan tampilkan error jika request dibatalkan
            if (error.name === 'AbortError') {
                console.log('Feasibility request was aborted');
                return;
            }
            
            console.error('Error during feasibility analysis (Network/Parsing):', error);
            showMessage('Terjadi kesalahan saat analisis kelayakan.', 'error');
            feasibilityResult.classList.add('hidden');
        } finally {
            // Reset abort controller
            feasibilityAbortController = null;
        }
        
        lucide.createIcons();
    });


    // --- INITIALIZATION ---
    // Atur tanggal transaksi default ke hari ini
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

    // Auto-login jika token sudah ada
    if (authToken && authToken.trim() !== '') {
        console.log('Token found in localStorage, attempting auto-login...');
        showApp();
    } else {
        console.log('No valid token found, showing auth screen...');
        showAuth();
    }

    // Add these functions after existing utility functions
const showProfilePage = () => {
    switchPage('profile');
    // Update current name in the form
    currentNameInput.value = currentUserName || '';
    // Update profile avatar
    if (currentUserName) {
        const initial = currentUserName.charAt(0).toUpperCase();
        profileAvatar.src = `https://placehold.co/80x80/6366f1/ffffff?text=${initial}`;
    }
    hideProfileDropdown();
};

const showProfileDropdown = () => {
    profileDropdown.classList.remove('hidden');
};

const hideProfileDropdown = () => {
    profileDropdown.classList.add('hidden');
};

const updateUserProfile = async (name) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/update-profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            const userData = await response.json();
            currentUserName = userData.name;
            userNameDisplay.textContent = currentUserName;
            const initial = currentUserName.charAt(0).toUpperCase();
            userAvatarDisplay.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initial}`;
            profileAvatar.src = `https://placehold.co/80x80/6366f1/ffffff?text=${initial}`;
            currentNameInput.value = currentUserName;
            showMessage('Nama berhasil diperbarui!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || 'Gagal memperbarui nama.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Terjadi kesalahan saat memperbarui nama.', 'error');
        return false;
    }
};

const changeUserPassword = async (currentPassword, newPassword) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                current_password: currentPassword, 
                new_password: newPassword 
            })
        });

        if (response.ok) {
            showMessage('Password berhasil diubah!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || 'Gagal mengubah password.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('Terjadi kesalahan saat mengubah password.', 'error');
        return false;
    }
};

// Profile dropdown toggle
userProfileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (profileDropdown.classList.contains('hidden')) {
        showProfileDropdown();
    } else {
        hideProfileDropdown();
    }
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userProfileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
        hideProfileDropdown();
    }
});

// Profile menu button
profileMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showProfilePage();
});

// Logout from dropdown
logoutDropdownBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearAuthToken();
    showAuth();
});

// Update name form
updateNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = newNameInput.value.trim();
    
    if (!newName) {
        showMessage('Nama tidak boleh kosong.', 'warning');
        return;
    }
    
    if (newName === currentUserName) {
        showMessage('Nama baru sama dengan nama saat ini.', 'warning');
        return;
    }
    
    const success = await updateUserProfile(newName);
    if (success) {
        newNameInput.value = '';
    }
});

// Change password form
changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('Semua field password harus diisi.', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Konfirmasi password tidak cocok.', 'warning');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Password baru minimal 6 karakter.', 'warning');
        return;
    }
    
    const success = await changeUserPassword(currentPassword, newPassword);
    if (success) {
        changePasswordForm.reset();
    }
});
});
