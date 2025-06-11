// document.addEventListener('DOMContentLoaded', () => {
//     // --- DOM ELEMENTS CACHING ---
//     const authScreen = document.getElementById('auth-screen');
//     const appScreen = document.getElementById('app-screen');

//     const loginForm = document.getElementById('login-form');
//     const registerForm = document.getElementById('register-form');

//     const showRegisterBtn = document.getElementById('show-register-btn');
//     const showLoginBtn = document.getElementById('show-login-btn');

//     const logoutBtn = document.getElementById('logout-btn');

//     const navLinks = document.querySelectorAll('.nav-link');
//     const pageContents = document.querySelectorAll('.page-content');
//     const pageTitle = document.getElementById('page-title');
//     const userNameDisplay = document.getElementById('user-name-display');
//     const userAvatarDisplay = document.getElementById('user-avatar-display');

//     const totalPemasukanEl = document.getElementById('total-pemasukan');
//     const totalPengeluaranEl = document.getElementById('total-pengeluaran');
//     const saldoSaatIniEl = document.getElementById('saldo-saat-ini');
//     const totalTransaksiEl = document.getElementById('total-transaksi');

//     const transactionForm = document.getElementById('transaction-form');
//     const transactionTableBody = document.getElementById('transaction-table-body');

//     // ... caching for other elements ...

//     // --- DATA & STATE MANAGEMENT ---
//     // Mensimulasikan database pengguna sederhana
//     let users = [
//         { 
//             name: 'Jolly Watson', 
//             email: 'user@finsight.com', 
//             password: 'password123',
//             transactions: [
//                 { id: 1, date: '2025-05-05', type: 'pemasukan', amount: 5000000, category: 'Penjualan Produk', description: 'Penjualan batch 1' },
//                 { id: 2, date: '2025-05-10', type: 'pengeluaran', amount: 1500000, category: 'Bahan Baku', description: 'Beli kain katun' },
//                 { id: 3, date: '2025-05-15', type: 'pengeluaran', amount: 500000, category: 'Pemasaran', description: 'Iklan media sosial' },
//                 { id: 4, date: '2025-06-01', type: 'pemasukan', amount: 7500000, category: 'Penjualan Produk', description: 'Penjualan batch 2' },
//                 { id: 5, date: '2025-06-03', type: 'pengeluaran', amount: 2000000, category: 'Bahan Baku', description: 'Beli kain sutra' },
//                 { id: 6, date: '2025-06-08', type: 'pengeluaran', amount: 750000, category: 'Gaji', description: 'Gaji 1 Karyawan' },
//             ] 
//         }
//     ];
    
//     let chartInstances = {};
//     let currentUser = null;

//     // --- UTILITY FUNCTIONS ---
//     const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
//     const destroyChart = (chartId) => {
//         if (chartInstances[chartId]) {
//             chartInstances[chartId].destroy();
//             delete chartInstances[chartId];
//         }
//     };

//     // --- AUTHENTICATION LOGIC ---
//     const showApp = () => {
//         authScreen.classList.add('hidden');
//         appScreen.classList.remove('hidden');
        
//         if (currentUser && currentUser.name) {
//             userNameDisplay.textContent = currentUser.name;
//             const initial = currentUser.name.charAt(0).toUpperCase();
//             userAvatarDisplay.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initial}`;
//         }

//         renderDashboard();
//         renderTransactionTable();
//         switchPage('dashboard'); // Ensure dashboard is the first page shown
//         lucide.createIcons();
//     };

//     const showAuth = () => {
//         appScreen.classList.add('hidden');
//         authScreen.classList.remove('hidden');
//         loginForm.classList.remove('hidden');
//         registerForm.classList.add('hidden');
//         lucide.createIcons();
//     };

//     // --- CORE APP LOGIC ---
//     const switchPage = (pageId) => {
//         pageContents.forEach(page => page.classList.add('hidden'));
//         const activePage = document.getElementById(`page-${pageId}`);
//         if (activePage) activePage.classList.remove('hidden');

//         navLinks.forEach(link => {
//             link.classList.remove('active', 'bg-indigo-600');
//             if (link.dataset.page === pageId) link.classList.add('active', 'bg-indigo-600');
//         });

//         const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"] span`);
//         if(activeLink) pageTitle.textContent = activeLink.textContent;
        
//         lucide.createIcons();
//     };

//     const renderTransactionTable = () => {
//         transactionTableBody.innerHTML = '';
//         if (!currentUser) return; // Safety check

//         const userTransactions = currentUser.transactions || [];

//         if (userTransactions.length === 0) {
//             const row = document.createElement('tr');
//             row.innerHTML = `<td colspan="5" class="p-4 text-center text-slate-400">Belum ada transaksi. Silakan tambahkan transaksi baru.</td>`;
//             transactionTableBody.appendChild(row);
//             return;
//         }

//         userTransactions
//             .sort((a, b) => new Date(b.date) - new Date(a.date))
//             .forEach(tx => {
//                 const row = document.createElement('tr');
//                 row.className = 'border-b border-slate-700 hover:bg-slate-700/50';
//                 row.innerHTML = `
//                     <td class="p-3">${tx.date}</td>
//                     <td class="p-3">${tx.description}</td>
//                     <td class="p-3"><span class="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-1 rounded-full">${tx.category}</span></td>
//                     <td class="p-3 text-right font-medium ${tx.type === 'pemasukan' ? 'text-green-400' : 'text-red-400'}">
//                         ${tx.type === 'pemasukan' ? '+' : '-'} ${formatCurrency(tx.amount)}
//                     </td>
//                     <td class="p-3 text-center">
//                         <button class="text-red-400 hover:text-red-600 delete-tx-btn" data-id="${tx.id}">
//                             <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
//                         </button>
//                     </td>
//                 `;
//                 transactionTableBody.appendChild(row);
//             });
//         lucide.createIcons();
//     };

//     const deleteTransaction = (id) => {
//         if (!currentUser) return;
//         const isConfirmed = confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
//         if (isConfirmed) {
//             currentUser.transactions = currentUser.transactions.filter(tx => tx.id !== id);
//             renderDashboard();
//             renderTransactionTable();
//         }
//     };

//     const renderDashboard = () => {
//         if (!currentUser) return;

//         const userTransactions = currentUser.transactions || [];
//         const totalPemasukan = userTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0);
//         const totalPengeluaran = userTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0);
//         const saldo = totalPemasukan - totalPengeluaran;
        
//         totalPemasukanEl.textContent = formatCurrency(totalPemasukan);
//         totalPengeluaranEl.textContent = formatCurrency(totalPengeluaran);
//         saldoSaatIniEl.textContent = formatCurrency(saldo);
        
//         const currentMonth = new Date().getMonth();
//         const currentYear = new Date().getFullYear();
//         const txThisMonth = userTransactions.filter(t => new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear);
//         totalTransaksiEl.textContent = txThisMonth.length;
        
//         renderCashflowChart();
//         renderCategoryPieChart('categoryPieChartDashboard');
//     };

//     // --- CHART RENDERING ---
//     const renderCashflowChart = () => {
//         destroyChart('cashflowChart'); 
//         const ctx = document.getElementById('cashflowChart').getContext('2d');
//         if (!currentUser || !currentUser.transactions || currentUser.transactions.length === 0) {
//              ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//              ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
//              ctx.textAlign = 'center';
//              ctx.fillText('Data tidak tersedia untuk ditampilkan.', ctx.canvas.width / 2, ctx.canvas.height / 2);
//              return;
//         }

//         // --- DYNAMIC DATA CALCULATION ---
//         const labels = [];
//         const incomeData = Array(6).fill(0);
//         const expenseData = Array(6).fill(0);
//         const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
//         const today = new Date();

//         // 1. Generate labels for the last 6 months
//         for (let i = 5; i >= 0; i--) {
//             const d = new Date(today);
//             d.setMonth(today.getMonth() - i);
//             labels.push(monthNames[d.getMonth()]);
//         }

//         // 2. Filter transactions for the last 6 months and aggregate data
//         const sixMonthsAgo = new Date();
//         sixMonthsAgo.setMonth(today.getMonth() - 5);
//         sixMonthsAgo.setDate(1);
//         sixMonthsAgo.setHours(0,0,0,0);

//         const relevantTransactions = currentUser.transactions.filter(tx => new Date(tx.date) >= sixMonthsAgo);

//         relevantTransactions.forEach(tx => {
//             const txDate = new Date(tx.date);
//             const monthDiff = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());
            
//             // Index 5 is current month, 0 is 5 months ago
//             const index = 5 - monthDiff;

//             if (index >= 0 && index < 6) {
//                 if (tx.type === 'pemasukan') {
//                     incomeData[index] += tx.amount;
//                 } else {
//                     expenseData[index] += tx.amount;
//                 }
//             }
//         });

//         // 3. Render the chart with dynamic data
//         chartInstances['cashflowChart'] = new Chart(ctx, { 
//             type: 'bar', 
//             data: { 
//                 labels: labels, 
//                 datasets: [ 
//                     { label: 'Pemasukan', data: incomeData, backgroundColor: '#22c55e', borderRadius: 5 }, 
//                     { label: 'Pengeluaran', data: expenseData, backgroundColor: '#ef4444', borderRadius: 5 } 
//                 ] 
//             }, 
//             options: { 
//                 responsive: true, 
//                 plugins: { legend: { labels: { color: '#cbd5e1' } } }, 
//                 scales: { 
//                     y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.2)' } }, 
//                     x: { ticks: { color: '#94a3b8' }, grid: { display: false } } 
//                 } 
//             } 
//         });
//     };

//     const renderCategoryPieChart = (canvasId) => {
//         destroyChart(canvasId); 
//         const ctx = document.getElementById(canvasId).getContext('2d');
//         if (!currentUser) return;
        
//         const expenseCategories = (currentUser.transactions || [])
//             .filter(t => t.type === 'pengeluaran')
//             .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

//         if (Object.keys(expenseCategories).length === 0) {
//             ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//             ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
//             ctx.textAlign = 'center';
//             ctx.fillText('Tidak ada data pengeluaran.', ctx.canvas.width / 2, ctx.canvas.height / 2);
//             return;
//         }

//         chartInstances[canvasId] = new Chart(ctx, { 
//             type: 'doughnut', 
//             data: { labels: Object.keys(expenseCategories), datasets: [{ data: Object.values(expenseCategories), backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#3b82f6', '#8b5cf6'], borderColor: '#1e293b', borderWidth: 4 }] }, 
//             options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } } } } 
//         });
//     };
    
//     // --- EVENT LISTENERS ---
//     showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); });
//     showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });

//     loginForm.addEventListener('submit', (e) => {
//         e.preventDefault();
//         const email = document.getElementById('login-email').value;
//         const password = document.getElementById('login-password').value;
//         const foundUser = users.find(user => user.email === email && user.password === password);
//         if (foundUser) {
//             currentUser = foundUser;
//             showApp();
//         } else {
//             alert('Email atau password salah. Silakan coba lagi.');
//         }
//     });

//     registerForm.addEventListener('submit', (e) => {
//         e.preventDefault();
//         const name = document.getElementById('register-name').value;
//         const email = document.getElementById('register-email').value;
//         const password = document.getElementById('register-password').value;
//         if (users.find(user => user.email === email)) {
//             alert('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.');
//             return;
//         }
        
//         const newUser = { 
//             name: name || 'Pengguna Baru', 
//             email: email, 
//             password: password,
//             transactions: []
//         };
//         users.push(newUser);
//         currentUser = newUser;
//         showApp();
//     });

//     logoutBtn.addEventListener('click', (e) => { e.preventDefault(); currentUser = null; showAuth(); });
//     navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchPage(e.currentTarget.dataset.page); }); });
//     transactionForm.addEventListener('submit', (e) => { 
//         e.preventDefault(); 
//         if (!currentUser) return;

//         const newTx = { 
//             id: Date.now(), 
//             date: document.getElementById('tx-date').value, 
//             type: document.getElementById('tx-type').value, 
//             amount: parseFloat(document.getElementById('tx-amount').value), 
//             category: document.getElementById('tx-category').value, 
//             description: document.getElementById('tx-description').value, 
//         }; 
        
//         currentUser.transactions.push(newTx); 
        
//         renderDashboard(); 
//         renderTransactionTable(); 
//         transactionForm.reset(); 
//         document.getElementById('tx-date').value = new Date().toISOString().split('T')[0]; 
//         switchPage('manajemen');
//     });
//     transactionTableBody.addEventListener('click', (e) => { const deleteButton = e.target.closest('.delete-tx-btn'); if (deleteButton) { deleteTransaction(parseInt(deleteButton.dataset.id, 10)); } });
    
//     // --- ON INITIAL PAGE LOAD ---
//     showAuth();
// });
