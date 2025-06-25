# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import time
import sys

from app.config import IS_PROD, BASE_URL
from app.database import Base, engine

# Import routers
from app.routers import users, transactions, dashboard, predictions, recommendations, analysis, community, reports

app = FastAPI(
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
    title="FinSight API",
    version="1.0.0",
    description="API untuk aplikasi FinSight - Manajemen Keuangan Pribadi",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[BASE_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Route untuk melayani index.html saat root URL diakses
@app.get("/")
async def read_root():
    return FileResponse("landing.html")  # Changed from index.html to landing.html

@app.get("/index.html")
async def serve_app():
    return FileResponse("index.html")

@app.get("/config.js")
def get_config():
    return Response(
        content=f'window.env = {{ BASE_URL: "{BASE_URL}" }};',
        media_type="application/javascript"
    )

# Include routers
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(predictions.router)
app.include_router(recommendations.router)
app.include_router(analysis.router)
app.include_router(community.router)
app.include_router(reports.router)

# Create tables
@app.on_event("startup")
def on_startup():
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to database (attempt {attempt + 1}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            print("Database connection successful!")
            break
        except Exception as e:
            print(f"Database connection failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Exiting...")
                sys.exit(1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True if not IS_PROD else False)