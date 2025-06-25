# app/auth.py
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import User
from app.crud import verify_password, get_user_by_email

# Setup HTTP Bearer token security scheme untuk FastAPI
security = HTTPBearer()

def create_access_token(data: dict):
    """
    Membuat JWT access token dengan data payload dan waktu kadaluarsa
    
    Args:
        data (dict): Data yang akan di-encode dalam token (biasanya user info)
    
    Returns:
        str: JWT token yang sudah di-encode
    """
    to_encode = data.copy()
    # Set waktu kadaluarsa token berdasarkan konfigurasi
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Encode data menjadi JWT token menggunakan secret key dan algoritma
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Mendapatkan user yang sedang login berdasarkan JWT token
    
    Args:
        credentials: HTTP Authorization credentials dari Bearer token
        db: Database session untuk query user
    
    Returns:
        User: Object user yang sedang login
        
    Raises:
        HTTPException: Jika token tidak valid atau user tidak ditemukan
    """
    # Exception yang akan di-raise jika kredensial tidak valid
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token untuk mendapatkan payload
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        # Ambil email dari subject token
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        # Jika terjadi error saat decode token (token rusak/kadaluarsa)
        raise credentials_exception
    
    # Cari user berdasarkan email dari token
    user = get_user_by_email(db, email=email)
    if user is None:
        # Jika user tidak ditemukan di database
        raise credentials_exception
    return user