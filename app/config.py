# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

IS_PROD = os.getenv("ENVIRONMENT") == "production"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/finsight_db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000") # Default untuk development

# Konfigurasi untuk API Eksternal (Contoh OpenRouter)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")