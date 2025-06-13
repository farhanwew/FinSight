# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionCreate(BaseModel):
    date: date
    type: str
    amount: float
    category: str
    description: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    date: date
    type: str
    amount: float
    category: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True # Mengizinkan ORM model menjadi Pydantic model

class BusinessRecommendationRequest(BaseModel):
    modal: float
    minat: Optional[str] = None
    lokasi: Optional[str] = None

class BusinessRecommendationItem(BaseModel):
    nama: str
    deskripsi: str
    modal_dibutuhkan: int
    potensi_keuntungan: str
    tingkat_risiko: str

class BusinessRecommendationResponse(BaseModel):
    recommendations: List[BusinessRecommendationItem]

class CashFlowPredictionResponse(BaseModel):
    predicted_income: float
    predicted_expense: float
    insight: str

class FeasibilityAnalysisResponse(BaseModel):
    profit_bersih: float
    roi: float
    break_even_months: Optional[float] # Changed to Optional[float]
    feasibility_status: str
