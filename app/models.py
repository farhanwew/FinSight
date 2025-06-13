# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, Date, JSON
from sqlalchemy.types import DECIMAL
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False)
    type = Column(String(20), nullable=False)  # 'pemasukan' atau 'pengeluaran'
    amount = Column(DECIMAL(15, 2), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BusinessRecommendation(Base):
    __tablename__ = "business_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    modal = Column(DECIMAL(15, 2), nullable=False)
    minat = Column(String(255))
    lokasi = Column(String(100))
    recommendations = Column(JSON)
    generated_at = Column(DateTime, default=datetime.utcnow)

class CashFlowPrediction(Base):
    __tablename__ = "cash_flow_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    predicted_income = Column(DECIMAL(15, 2))
    predicted_expense = Column(DECIMAL(15, 2))
    prediction_date = Column(Date, nullable=False)
    insight = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)