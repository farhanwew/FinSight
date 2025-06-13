# app/crud.py
from sqlalchemy.orm import Session
from app.models import User, Transaction, CashFlowPrediction, BusinessRecommendation
from app.schemas import UserCreate, TransactionCreate
from passlib.context import CryptContext
from datetime import datetime, date, timedelta
from typing import Optional # <--- ADD THIS IMPORT

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_transaction(db: Session, transaction: TransactionCreate, user_id: int):
    db_transaction = Transaction(
        user_id=user_id,
        date=transaction.date,
        type=transaction.type,
        amount=transaction.amount,
        category=transaction.category,
        description=transaction.description
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(db: Session, user_id: int):
    return db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.desc()).all()

def delete_transaction(db: Session, transaction_id: int, user_id: int):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False

def get_transactions_for_cashflow_prediction(db: Session, user_id: int, months_ago: int = 3):
    three_months_ago = datetime.now() - timedelta(days=months_ago * 30) # Approx 30 days per month
    return db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.created_at >= three_months_ago
    ).all()

def create_cashflow_prediction(db: Session, user_id: int, predicted_income: float, predicted_expense: float, insight: str):
    prediction = CashFlowPrediction(
        user_id=user_id,
        predicted_income=predicted_income,
        predicted_expense=predicted_expense,
        prediction_date=date.today() + timedelta(days=30),
        insight=insight
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction

def create_business_recommendation(db: Session, user_id: int, modal: float, minat: Optional[str], lokasi: Optional[str], recommendations: dict):
    recommendation_record = BusinessRecommendation(
        user_id=user_id,
        modal=modal,
        minat=minat,
        lokasi=lokasi,
        recommendations=recommendations
    )
    db.add(recommendation_record)
    db.commit()
    db.refresh(recommendation_record)
    return recommendation_record
