# app/routers/recommendations.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.llm_service import get_business_recommendations_from_llm

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)

@router.post("/business", response_model=schemas.BusinessRecommendationResponse)
async def generate_business_recommendations(
    request: schemas.BusinessRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommendations_data = await get_business_recommendations_from_llm(
        request.modal, request.minat, request.lokasi
    )
    
    # Simpan ke database
    crud.create_business_recommendation(
        db, current_user.id, request.modal, request.minat, request.lokasi, {"recommendations": recommendations_data}
    )
    
    return {"recommendations": recommendations_data}