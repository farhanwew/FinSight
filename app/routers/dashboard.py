# app/routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app import crud
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = crud.get_transactions(db, current_user.id) # Re-use get_transactions from crud
    
    total_pemasukan = sum(float(t.amount) for t in transactions if t.type == 'pemasukan')
    total_pengeluaran = sum(float(t.amount) for t in transactions if t.type == 'pengeluaran')
    saldo = total_pemasukan - total_pengeluaran
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    tx_this_month = [t for t in transactions if t.date.month == current_month and t.date.year == current_year]
    
    return {
        "total_pemasukan": total_pemasukan,
        "total_pengeluaran": total_pengeluaran,
        "saldo_saat_ini": saldo,
        "total_transaksi_bulan_ini": len(tx_this_month)
    }   