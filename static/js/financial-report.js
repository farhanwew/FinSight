import { getAuthHeaders } from './utils.js';
import { showMessage } from './utils.js';
import { BASE_URL } from './utils.js';

export const setupReportListeners = () => {
    const generateReportBtn = document.getElementById('generate-report-btn');
    const reportLoading = document.getElementById('report-loading');
    
    if (!generateReportBtn) return;
    
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    
    startDateInput.value = firstDay.toISOString().split('T')[0];
    endDateInput.value = lastDay.toISOString().split('T')[0];
    
    generateReportBtn.addEventListener('click', async () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            showMessage('Mohon pilih rentang tanggal untuk laporan.', 'warning');
            return;
        }
        
        reportLoading.classList.remove('hidden');
        
        try {
            const response = await fetch(`${BASE_URL}/reports/financial?start_date=${startDate}&end_date=${endDate}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Set the filename
                const fileName = `FinSight_Laporan_${startDate}_sampai_${endDate}.pdf`;
                a.download = fileName;
                
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                
                showMessage('Laporan berhasil diunduh dalam format PDF.', 'success');
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Gagal mengunduh laporan PDF.', 'error');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            showMessage('Terjadi kesalahan saat mengunduh laporan.', 'error');
        } finally {
            reportLoading.classList.add('hidden');
        }
    });
};