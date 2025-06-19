// static/js/analysis.js
import { analysisAPI } from './api.js';
import { showMessage, formatCurrency, destroyChart, chartInstances, DOMElements } from './utils.js';

const feasibilityForm = DOMElements.feasibilityForm || document.getElementById('feasibility-form');
const feaModalInput = DOMElements.feaModalInput || document.getElementById('fea-modal');
const feaBiayaInput = DOMElements.feaBiayaInput || document.getElementById('fea-biaya');
const feaPemasukanInput = DOMElements.feaPemasukanInput || document.getElementById('fea-pemasukan');
const feasibilityResult = DOMElements.feasibilityResult || document.getElementById('feasibility-result');
const feasibilityOutput = DOMElements.feasibilityOutput || document.getElementById('feasibility-output');
const feasibilityStatusEl = DOMElements.feasibilityStatusEl || document.getElementById('feasibility-status');
const feaProfitEl = DOMElements.feaProfitEl || document.getElementById('fea-profit');
const feaRoiEl = DOMElements.feaRoiEl || document.getElementById('fea-roi');
const feaBepEl = DOMElements.feaBepEl || document.getElementById('fea-bep');
const breakEvenChartCanvas = DOMElements.breakEvenChartCanvas || document.getElementById('breakEvenChart');
const feasibilityLoading = DOMElements.feasibilityLoading || document.getElementById('feasibility-loading');
const feasibilityAiInsightEl = DOMElements.feasibilityAiInsightEl || document.getElementById('feasibility-ai-insight');

let feasibilityAbortController = null;

export const setupAnalysisListeners = () => {
    feasibilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modalAwal = parseFloat(feaModalInput.value);
        const biayaOperasional = parseFloat(feaBiayaInput.value);
        const estimasiPemasukan = parseFloat(feaPemasukanInput.value);

        if (isNaN(modalAwal) || isNaN(biayaOperasional) || isNaN(estimasiPemasukan)) {
            showMessage('Mohon masukkan semua nilai numerik yang valid untuk analisis kelayakan.', 'warning');
            return;
        }

        if (feasibilityAbortController) {
            feasibilityAbortController.abort();
        }

        feasibilityAbortController = new AbortController();

        feasibilityResult.classList.remove('hidden');
        feasibilityLoading.classList.remove('hidden');
        feasibilityOutput.classList.add('hidden');

        try {
            const response = await analysisAPI.analyzeFeasibility(modalAwal, biayaOperasional, estimasiPemasukan, feasibilityAbortController.signal);

            if (response.ok) {
                const data = await response.json();
                console.log('Feasibility Analysis Data Received:', data);

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
                
                if (feasibilityAiInsightEl && data.ai_insight) {
                    feasibilityAiInsightEl.textContent = data.ai_insight;
                }
                
                renderBreakEvenChart(data.break_even_months, modalAwal, (estimasiPemasukan - biayaOperasional));

            } else {
                const errorData = await response.json();
                console.error('Feasibility Analysis API Error:', errorData);
                showMessage(errorData.detail || 'Gagal melakukan analisis kelayakan.', 'error');
                feasibilityResult.classList.add('hidden');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Feasibility request was aborted');
                return;
            }
            
            console.error('Error during feasibility analysis (Network/Parsing):', error);
            showMessage('Terjadi kesalahan saat analisis kelayakan.', 'error');
            feasibilityResult.classList.add('hidden');
        } finally {
            feasibilityAbortController = null;
        }
        lucide.createIcons();
    });
};

const renderBreakEvenChart = (breakEvenMonths, modalAwal, profitBersihPerBulan) => {
    destroyChart('breakEvenChart');
    const ctx = document.getElementById('breakEvenChart').getContext('2d');

    if (breakEvenMonths === null || breakEvenMonths <= 0 || profitBersihPerBulan <= 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('Grafik tidak tersedia (defisit atau balik modal tidak tercapai).', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const numMonthsToShow = Math.ceil(breakEvenMonths) + 3;
    const labels = Array.from({length: numMonthsToShow > 20 ? 20 : numMonthsToShow}, (_, i) => `Bulan ${i + 1}`);

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
                    hidden: true
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