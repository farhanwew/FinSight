# app/routers/predictions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random
from datetime import date, timedelta
from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.llm_service import get_llm_insight # Asumsi Anda akan membuat fungsi ini

router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"]
)

@router.post("/cashflow", response_model=schemas.CashFlowPredictionResponse)
async def generate_cashflow_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = crud.get_transactions_for_cashflow_prediction(db, current_user.id)
    
    if not transactions:
        raise HTTPException(status_code=400, detail="Tidak cukup data untuk prediksi")
    
    pemasukan_list = [float(t.amount) for t in transactions if t.type == 'pemasukan']
    pengeluaran_list = [float(t.amount) for t in transactions if t.type == 'pengeluaran']
    
    avg_pemasukan = sum(pemasukan_list) / len(pemasukan_list) if pemasukan_list else 0
    avg_pengeluaran = sum(pengeluaran_list) / len(pengeluaran_list) if pengeluaran_list else 0
    
    # Perhitungan inti tetap di backend
    predicted_income = avg_pemasukan * (1 + random.uniform(-0.1, 0.2))
    predicted_expense = avg_pengeluaran * (1 + random.uniform(-0.1, 0.1))
    
    net_prediction = predicted_income - predicted_expense
    
    # Gunakan LLM untuk menghasilkan insight yang lebih cerdas
    # Anda perlu membuat prompt yang baik untuk LLM
    llm_prompt = f"""Saya memprediksi arus kas bulan depan dengan pemasukan {predicted_income:,.0f} dan pengeluaran {predicted_expense:,.0f}. Saldo bersih diprediksi {net_prediction:,.0f}. 
    Berikan insight atau saran finansial singkat (maksimal 2-3 kalimat) berdasarkan prediksi ini untuk pemilik UMKM. Fokus pada tindakan praktis."""
    
    insight_from_llm = await get_llm_insight(llm_prompt)
    
    crud.create_cashflow_prediction(db, current_user.id, predicted_income, predicted_expense, insight_from_llm)
    
    return {
        "predicted_income": predicted_income,
        "predicted_expense": predicted_expense,
        "insight": insight_from_llm
    }
