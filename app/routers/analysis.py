# app/routers/analysis.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.llm_service import get_llm_insight 
from typing import Optional 
import math # Import math for isinf and isnan checks

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
    
    # Ensure modal_awal is not zero to prevent division by zero for ROI
    roi = (profit_bersih / modal_awal) * 100 if modal_awal != 0 else 0 

    break_even_months_display: Optional[float] = None
    break_even_months_for_llm: str
    feasibility_status_numeric: str

    # Use a small epsilon for comparing floats to zero to handle precision issues
    # If profit_bersih is a very small positive number, it can still lead to huge BEP
    if profit_bersih > 1e-9: # Check if profit_bersih is significantly positive
        calculated_bep = float(modal_awal) / profit_bersih
        
        # Check if the calculated BEP is infinite or NaN, or excessively large
        if math.isinf(calculated_bep) or math.isnan(calculated_bep) or calculated_bep > 1000000: # Add a large arbitrary limit
            break_even_months_display = None
            break_even_months_for_llm = "tidak terbatas (defisit atau terlalu lama)"
            feasibility_status_numeric = "Tidak Layak" # Mark as not feasible if BEP is extremely high
        else:
            break_even_months_display = calculated_bep
            break_even_months_for_llm = f"{calculated_bep:.1f} bulan"
            feasibility_status_numeric = "Layak" if calculated_bep <= 12 else "Kurang Layak"
    else:
        # If profit_bersih is zero or negative (or very close to zero and negative)
        break_even_months_display = None
        break_even_months_for_llm = "tidak terbatas (defisit)"
        feasibility_status_numeric = "Tidak Layak"

    # Ensure profit_bersih and roi are explicitly float before returning
    profit_bersih_float = float(profit_bersih)
    roi_float = float(roi)

    llm_prompt = f"""Seorang pemilik UMKM memiliki modal awal Rp {modal_awal:,.0f}, biaya operasional bulanan Rp {biaya_operasional:,.0f}, dan estimasi pemasukan bulanan Rp {estimasi_pemasukan:,.0f}.
    Profit bersih bulanan adalah Rp {profit_bersih_float:,.0f}, ROI {roi_float:.2f}%, dan perkiraan waktu balik modal {break_even_months_for_llm}. Status kelayakan bisnis ini secara numerik adalah '{feasibility_status_numeric}'.
    Berikan analisis singkat dan saran strategis (maksimal 3-4 kalimat) tentang kelayakan bisnis ini dari perspektif seorang konsultan bisnis."""
    
    insight_from_llm = await get_llm_insight(llm_prompt)
    
    return {
        "profit_bersih": profit_bersih_float,
        "roi": roi_float,
        "break_even_months": break_even_months_display, 
        "feasibility_status": insight_from_llm 
    }
