# app/routers/analysis.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.llm_service import get_llm_insight 
from typing import Optional 
import math 

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"]
)

@router.post("/feasibility", response_model=schemas.FeasibilityAnalysisResponse)
async def analyze_feasibility(
    modal_awal: float,
    biaya_operasional: float,
    estimasi_pemasukan: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profit_bersih = estimasi_pemasukan - biaya_operasional
    
    roi = (profit_bersih / modal_awal) * 100 if modal_awal != 0 else 0 

    break_even_months_display: Optional[float] = None
    break_even_months_for_llm: str
    feasibility_status_numeric: str # Ini akan menjadi field 'feasibility_status' di response

    if profit_bersih > 1e-9: # Cek jika profit_bersih cukup positif
        calculated_bep = float(modal_awal) / profit_bersih
        
        if math.isinf(calculated_bep) or math.isnan(calculated_bep) or calculated_bep > 1000000: 
            break_even_months_display = None
            break_even_months_for_llm = "tidak terbatas (defisit atau terlalu lama)"
            feasibility_status_numeric = "Tidak Layak" 
        else:
            break_even_months_display = calculated_bep
            break_even_months_for_llm = f"{calculated_bep:.1f} bulan"
            feasibility_status_numeric = "Layak" if calculated_bep <= 12 else "Kurang Layak"
    else:
        break_even_months_display = None
        break_even_months_for_llm = "tidak terbatas (defisit)"
        feasibility_status_numeric = "Tidak Layak"

    profit_bersih_float = float(profit_bersih)
    roi_float = float(roi)

    # Prompt LLM tanpa menyertakan status numerik, karena itu akan ditangani di frontend
    llm_prompt = f"""Seorang pemilik UMKM melakukan analisis kelayakan bisnis dengan modal awal Rp {modal_awal:,.0f}, biaya operasional bulanan Rp {biaya_operasional:,.0f}, dan estimasi pemasukan bulanan Rp {estimasi_pemasukan:,.0f}.
    Hasil perhitungannya adalah: profit bersih bulanan Rp {profit_bersih_float:,.0f}, ROI {roi_float:.2f}%, dan perkiraan waktu balik modal {break_even_months_for_llm}.
    Berikan analisis singkat dan saran strategis (maksimal 3-4 kalimat) berdasarkan angka-angka tersebut, dari perspektif seorang konsultan bisnis."""
    
    insight_from_llm = await get_llm_insight(llm_prompt)
    
    return {
        "profit_bersih": profit_bersih_float,
        "roi": roi_float,
        "break_even_months": break_even_months_display, 
        "feasibility_status": feasibility_status_numeric, # Mengembalikan status numerik
        "ai_insight": insight_from_llm # Mengembalikan insight LLM di field terpisah
    }
