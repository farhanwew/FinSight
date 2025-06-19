// static/js/recommendations.js
import { recommendationsAPI } from './api.js';
import { showMessage, formatCurrency, DOMElements } from './utils.js';

const recModalInput = DOMElements.recModalInput || document.getElementById('rec-modal');
const recMinatInput = DOMElements.recMinatInput || document.getElementById('rec-minat');
const recLokasiInput = DOMElements.recLokasiInput || document.getElementById('rec-lokasi');
const generateRecommendationBtn = DOMElements.generateRecommendationBtn || document.getElementById('generate-recommendation-btn');
const recommendationResult = DOMElements.recommendationResult || document.getElementById('recommendation-result');
const recommendationLoading = DOMElements.recommendationLoading || document.getElementById('recommendation-loading');
const recommendationOutput = DOMElements.recommendationOutput || document.getElementById('recommendation-output');
const recommendationCardsContainer = DOMElements.recommendationCardsContainer || document.getElementById('recommendation-cards');

export const setupRecommendationListeners = () => {
    generateRecommendationBtn.addEventListener('click', async () => {
        recommendationResult.classList.remove('hidden');
        recommendationLoading.classList.remove('hidden');
        recommendationOutput.classList.add('hidden');
        recommendationCardsContainer.innerHTML = '';

        const modal = parseFloat(recModalInput.value);
        const minat = recMinatInput.value;
        const lokasi = recLokasiInput.value;

        try {
            const response = await recommendationsAPI.generateBusinessRecommendations(modal, minat, lokasi);

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
};