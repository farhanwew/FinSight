# requirements.txt
"""
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
python-dotenv==1.0.0
alembic==1.12.1
"""

# main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Date, JSON
from sqlalchemy.types import DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import random


# Tambahkan import ini
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse # Untuk melayani index.html sebagai root

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/finsight_db")
# Untuk development local bisa pakai SQLite: "sqlite:///./finsight.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="FinSight API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sesuaikan dengan domain frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="."), name="static")

# Route untuk melayani index.html saat root URL diakses
@app.get("/")
async def read_root():
    return FileResponse("index.html")


# Database Models
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

# Pydantic Models (Request/Response)
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    date: date
    type: str  # 'pemasukan' atau 'pengeluaran'
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

class BusinessRecommendationRequest(BaseModel):
    modal: float
    minat: Optional[str] = None
    lokasi: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# API Endpoints
@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }

@app.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_transaction = Transaction(
        user_id=current_user.id,
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

@app.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()
    return transactions

@app.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

@app.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    total_pemasukan = sum(float(t.amount) for t in transactions if t.type == 'pemasukan')
    total_pengeluaran = sum(float(t.amount) for t in transactions if t.type == 'pengeluaran')
    saldo = total_pemasukan - total_pengeluaran
    
    # Transaksi bulan ini
    current_month = datetime.now().month
    current_year = datetime.now().year
    tx_this_month = [t for t in transactions if t.date.month == current_month and t.date.year == current_year]
    
    return {
        "total_pemasukan": total_pemasukan,
        "total_pengeluaran": total_pengeluaran,
        "saldo_saat_ini": saldo,
        "total_transaksi_bulan_ini": len(tx_this_month)
    }

@app.post("/predictions/cashflow")
async def generate_cashflow_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ambil data transaksi 3 bulan terakhir
    three_months_ago = datetime.now() - timedelta(days=90)
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.created_at >= three_months_ago
    ).all()
    
    if not transactions:
        raise HTTPException(status_code=400, detail="Tidak cukup data untuk prediksi")
    
    # Hitung rata-rata pemasukan dan pengeluaran
    pemasukan_list = [float(t.amount) for t in transactions if t.type == 'pemasukan']
    pengeluaran_list = [float(t.amount) for t in transactions if t.type == 'pengeluaran']
    
    avg_pemasukan = sum(pemasukan_list) / len(pemasukan_list) if pemasukan_list else 0
    avg_pengeluaran = sum(pengeluaran_list) / len(pengeluaran_list) if pengeluaran_list else 0
    
    # Tambahkan variasi random untuk simulasi AI
    predicted_income = avg_pemasukan * (1 + random.uniform(-0.1, 0.2))
    predicted_expense = avg_pengeluaran * (1 + random.uniform(-0.1, 0.1))
    
    # Generate insight
    net_prediction = predicted_income - predicted_expense
    if net_prediction > 0:
        insight = f"Prediksi menunjukkan surplus sebesar Rp {net_prediction:,.0f}. Pertimbangkan untuk menabung atau reinvestasi."
    else:
        insight = f"Prediksi menunjukkan defisit sebesar Rp {abs(net_prediction):,.0f}. Pertimbangkan untuk mengurangi pengeluaran."
    
    # Simpan ke database
    prediction = CashFlowPrediction(
        user_id=current_user.id,
        predicted_income=predicted_income,
        predicted_expense=predicted_expense,
        prediction_date=date.today() + timedelta(days=30),
        insight=insight
    )
    db.add(prediction)
    db.commit()
    
    return {
        "predicted_income": predicted_income,
        "predicted_expense": predicted_expense,
        "insight": insight
    }

@app.post("/recommendations/business")
async def generate_business_recommendations(
    request: BusinessRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Simulasi rekomendasi berbasis AI
    recommendations = []
    
    if request.modal < 1000000:  # < 1 juta
        recommendations = [
            {
                "nama": "Warung Kopi Sederhana",
                "deskripsi": "Warung kopi dengan menu terbatas namun berkualitas",
                "modal_dibutuhkan": 800000,
                "potensi_keuntungan": "Rp 300k - 500k/bulan",
                "tingkat_risiko": "Rendah"
            },
            {
                "nama": "Jasa Laundry Kiloan",
                "deskripsi": "Layanan cuci pakaian dengan sistem kiloan",
                "modal_dibutuhkan": 1200000,
                "potensi_keuntungan": "Rp 500k - 800k/bulan",
                "tingkat_risiko": "Rendah"
            }
        ]
    elif request.modal < 5000000:  # 1-5 juta
        recommendations = [
            {
                "nama": "Toko Kelontong Modern",
                "deskripsi": "Toko kelontong dengan sistem kasir digital",
                "modal_dibutuhkan": 3000000,
                "potensi_keuntungan": "Rp 800k - 1.2jt/bulan",
                "tingkat_risiko": "Sedang"
            },
            {
                "nama": "Catering Rumahan",
                "deskripsi": "Layanan catering untuk acara kecil dan kantor",
                "modal_dibutuhkan": 2500000,
                "potensi_keuntungan": "Rp 1jt - 2jt/bulan",
                "tingkat_risiko": "Sedang"
            }
        ]
    else:  # > 5 juta
        recommendations = [
            {
                "nama": "Kedai Kopi Premium",
                "deskripsi": "Kedai kopi dengan konsep modern dan WiFi",
                "modal_dibutuhkan": 8000000,
                "potensi_keuntungan": "Rp 2jt - 4jt/bulan",
                "tingkat_risiko": "Sedang"
            },
            {
                "nama": "Toko Fashion Online",
                "deskripsi": "Toko fashion dengan fokus penjualan online",
                "modal_dibutuhkan": 6000000,
                "potensi_keuntungan": "Rp 1.5jt - 3jt/bulan",
                "tingkat_risiko": "Tinggi"
            }
        ]
    
    # Simpan ke database
    recommendation_record = BusinessRecommendation(
        user_id=current_user.id,
        modal=request.modal,
        minat=request.minat,
        lokasi=request.lokasi,
        recommendations=recommendations
    )
    db.add(recommendation_record)
    db.commit()
    
    return {"recommendations": recommendations}

@app.post("/analysis/feasibility")
async def analyze_feasibility(
    modal_awal: float,
    biaya_operasional: float,
    estimasi_pemasukan: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profit_bersih = estimasi_pemasukan - biaya_operasional
    roi = (profit_bersih / modal_awal) * 100 if modal_awal > 0 else 0
    
    if profit_bersih > 0:
        break_even_months = modal_awal / profit_bersih
        feasibility_status = "Layak" if break_even_months <= 12 else "Kurang Layak"
    else:
        break_even_months = float('inf')
        feasibility_status = "Tidak Layak"
    
    return {
        "profit_bersih": profit_bersih,
        "roi": roi,
        "break_even_months": break_even_months,
        "feasibility_status": feasibility_status
    }

# Create tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)