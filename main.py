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
from fastapi.responses import Response
from dotenv import load_dotenv
import random
import httpx
import json # Add this import


# Tambahkan import ini
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse # Untuk melayani index.html sebagai root

load_dotenv()


IS_PROD = os.getenv("ENVIRONMENT") == "production"

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/finsight_db")
# Untuk development local bisa pakai SQLite: "sqlite:///./finsight.db"

# Konfigurasi untuk API Eksternal (Contoh OpenRouter)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"# Ganti dengan URL API yang sesuai
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")  

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
    title="FinSight API",
    version="1.0.0",
    description="API untuk aplikasi FinSight - Manajemen Keuangan Pribadi",
)


base_url = os.getenv("BASE_URL", "development")  # Untuk menentukan environment
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[base_url],  # Sesuaikan dengan domain frontend
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
    # Persiapkan prompt untuk API LLM
    prompt_parts = [
        f"Berikan 3 rekomendasi usaha UMKM berdasarkan kriteria berikut:",
        f"- Modal tersedia: Rp {request.modal:,.0f}",
    ]
    if request.minat:
        prompt_parts.append(f"- Minat bidang usaha: {request.minat}")
    if request.lokasi:
        prompt_parts.append(f"- Target lokasi: {request.lokasi}")
    
    prompt_parts.append("\nFormat jawaban dalam bentuk JSON object dengan kunci 'recommendations' yang berisi array, di mana setiap objek memiliki kunci: 'nama' (string), 'deskripsi' (string), 'modal_dibutuhkan' (integer), 'potensi_keuntungan' (string, misal 'Rp X - Y/bulan'), dan 'tingkat_risiko' (string, 'Rendah', 'Sedang', atau 'Tinggi').")
    prompt_parts.append("Contoh format JSON yang diharapkan: {\"recommendations\": [{\"nama\": \"Warung Kopi Sederhana\", \"deskripsi\": \"Warung kopi dengan menu terbatas namun berkualitas\", \"modal_dibutuhkan\": 800000, \"potensi_keuntungan\": \"Rp 300k - 500k/bulan\", \"tingkat_risiko\": \"Rendah\"}]}")

    full_prompt = "\n".join(prompt_parts)

    recommendations = [] # Default jika API gagal

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API Key untuk layanan rekomendasi tidak dikonfigurasi.")

    try:
        async with httpx.AsyncClient() as client:
            api_response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": f"{MODEL_NAME}", 
                    "messages": [
                        {"role": "user", "content": full_prompt}
                    ],
                    "response_format": {"type": "json_object"} # Meminta output JSON jika model mendukung
                },
                timeout=30.0 # Timeout 30 detik
            )
            api_response.raise_for_status() # Akan raise error jika status code 4xx atau 5xx
            
            response_data = api_response.json()
            
            # Ekstrak konten dari respons API LLM
            # Struktur respons OpenRouter bisa bervariasi, sesuaikan parsing di bawah ini
            if response_data.get("choices") and len(response_data["choices"]) > 0:
                content_str = response_data["choices"][0].get("message", {}).get("content")
                if content_str:
                    try:
                        # Coba parse string konten sebagai JSON
                        # LLM mungkin tidak selalu mengembalikan JSON yang sempurna, jadi perlu error handling
                        parsed_content = json.loads(content_str) # Menggunakan json.loads dari modul json
                        if isinstance(parsed_content, dict) and "recommendations" in parsed_content:
                             recommendations = parsed_content["recommendations"]
                        elif isinstance(parsed_content, dict) and "usaha" in parsed_content:
                             recommendations = parsed_content["usaha"]
                        elif isinstance(parsed_content, list) : # Jika API langsung mengembalikan array
                            recommendations = parsed_content
                        else: # Jika format tidak sesuai, coba parsing manual sederhana atau fallback
                            print(f"Warning: Format JSON dari LLM tidak sesuai ekspektasi: {content_str}")
                            # Fallback ke rekomendasi default jika parsing gagal total
                            recommendations = [
                                {"nama": "Gagal memproses rekomendasi dari AI", "deskripsi": "Silakan coba lagi atau periksa konfigurasi.", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}
                            ]
                    except Exception as e:
                        print(f"Error parsing recommendations from LLM: {e}, content: {content_str}")
                        recommendations = [
                             {"nama": "Error parsing rekomendasi AI", "deskripsi": str(e), "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}
                        ]
                else:
                    recommendations = [{"nama": "Tidak ada konten dari AI", "deskripsi": "-", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}]
            else:
                 recommendations = [{"nama": "Tidak ada respons dari AI", "deskripsi": "-", "modal_dibutuhkan": 0, "potensi_keuntungan": "-", "tingkat_risiko": "-"}]


    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Gagal menghubungi layanan rekomendasi: {e.response.text}")
    except httpx.RequestError as e:
        print(f"Request error occurred: {e}")
        raise HTTPException(status_code=503, detail=f"Layanan rekomendasi tidak tersedia: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal saat memproses rekomendasi: {str(e)}")

    # Simpan ke database (opsional, tergantung apakah Anda ingin menyimpan hasil dari API eksternal)
    recommendation_record = BusinessRecommendation(
        user_id=current_user.id,
        modal=request.modal,
        minat=request.minat,
        lokasi=request.lokasi,
        recommendations=recommendations # Simpan hasil dari API
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
    
    
@app.get("/config.js")
def get_config():
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    return Response(
        content=f'window.env = {{ BASE_URL: "{base_url}" }};',
        media_type="application/javascript"
    )   

# Create tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)