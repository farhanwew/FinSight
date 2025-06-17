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
    break_even_months: Optional[float] # Tetap Optional[float]
    feasibility_status: str # Status numerik sederhana (Layak, Kurang Layak, Tidak Layak)
    ai_insight: str # Insight yang lebih detail dari LLM

# Add these new schemas
class UserUpdateProfile(BaseModel):
    name: str

class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str

class CommunityPostCreate(BaseModel):
    title: str
    content: str
    category: str
    image_url: Optional[str] = None

class CommunityPostResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    category: str
    likes_count: int
    comments_count: int
    created_at: datetime
    owner: dict  # Basic user info
    
    class Config:
        from_attributes = True

class CommunityCommentCreate(BaseModel):
    content: str

class CommunityCommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    author: dict  # Basic user info
    
    class Config:
        from_attributes = True

class UserPublic(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True
