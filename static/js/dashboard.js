// static/js/dashboard.js
import { dashboardAPI } from './api.js';
import { showMessage, formatCurrency, currentUserTransactions, destroyChart, chartInstances, DOMElements } from './utils.js';

const totalPemasukanEl = DOMElements.totalPemasukanEl || document.getElementById('total-pemasukan');
const totalPengeluaranEl = DOMElements.totalPengeluaranEl || document.getElementById('total-pengeluaran');
const saldoSaatIniEl = DOMElements.saldoSaatIniEl || document.getElementById('saldo-saat-ini');
const totalTransaksiEl = DOMElements.totalTransaksiEl || document.getElementById('total-transaksi');

export const renderDashboard = async () => {
    try {
        const response = await dashboardAPI.getSummary();
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
        labels.push(monthNames[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2));
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