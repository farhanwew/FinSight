// static/js/transactions.js
import { transactionsAPI } from './api.js';
import { showMessage, formatCurrency, currentUserTransactions, setCurrentUserTransactions, DOMElements } from './utils.js';
import { renderDashboard } from './dashboard.js'; // Import renderDashboard untuk refresh data
import { setupReportListeners } from './financial-report.js';

const transactionForm = DOMElements.transactionForm || document.getElementById('transaction-form');
const transactionTableBody = DOMElements.transactionTableBody || document.getElementById('transaction-table-body');

export const setupTransactionListeners = () => {
    // Set tanggal transaksi default ke hari ini
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

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
            const response = await transactionsAPI.createTransaction(newTx);

            if (response.ok) {
                showMessage('Transaksi berhasil disimpan!', 'success');
                await fetchTransactionsAndRefresh();
                transactionForm.reset(); 
                document.getElementById('tx-date').value = new Date().toISOString().split('T')[0]; // Set tanggal ke hari ini
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

    setupReportListeners();
};

export const fetchTransactionsAndRefresh = async () => {
    try {
        const response = await transactionsAPI.getTransactions();
        if (response.ok) {
            const transactions = await response.json();
            setCurrentUserTransactions(transactions);
            renderDashboard(); // Perbarui dashboard
            renderTransactionTable(); // Perbarui tabel transaksi
        } else {
            showMessage('Gagal memuat transaksi.', 'error');
            setCurrentUserTransactions([]); // Reset jika gagal
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showMessage('Terjadi kesalahan saat memuat transaksi.', 'error');
        setCurrentUserTransactions([]);
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
            const response = await transactionsAPI.deleteTransaction(id);
            if (response.ok) {
                showMessage('Transaksi berhasil dihapus!', 'success');
                await fetchTransactionsAndRefresh();
            } else {
                showMessage('Gagal menghapus transaksi.', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showMessage('Terjadi kesalahan saat menghapus transaksi.', 'error');
        }
    }
};