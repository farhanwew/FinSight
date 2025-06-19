// static/js/predictions.js
import { predictionsAPI } from './api.js';
import { showMessage, formatCurrency, DOMElements } from './utils.js';

const generatePredictionBtn = DOMElements.generatePredictionBtn || document.getElementById('generate-prediction-btn');
const predictionResult = DOMElements.predictionResult || document.getElementById('prediction-result');
const predictionLoading = DOMElements.predictionLoading || document.getElementById('prediction-loading');
const predictionOutput = DOMElements.predictionOutput || document.getElementById('prediction-output');
const predictedIncomeEl = DOMElements.predictedIncomeEl || document.getElementById('predicted-income');
const predictedExpenseEl = DOMElements.predictedExpenseEl || document.getElementById('predicted-expense');
const predictionInsightEl = DOMElements.predictionInsightEl || document.getElementById('prediction-insight');

export const setupPredictionListeners = () => {
    generatePredictionBtn.addEventListener('click', async () => {
        predictionResult.classList.remove('hidden');
        predictionLoading.classList.remove('hidden');
        predictionOutput.classList.add('hidden');

        try {
            const response = await predictionsAPI.generateCashflow();

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
                predictionResult.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error generating cashflow prediction:', error);
            showMessage('Terjadi kesalahan saat membuat prediksi arus kas. Pastikan ada cukup data transaksi.', 'error');
            predictionResult.classList.add('hidden');
        }
        lucide.createIcons();
    });
};