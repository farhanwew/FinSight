from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
import os
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Transaction
import app.crud as crud

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

@router.get("/financial")
async def generate_financial_report(
    start_date: date = Query(..., description="Tanggal awal laporan (format: YYYY-MM-DD)"),
    end_date: date = Query(..., description="Tanggal akhir laporan (format: YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate financial report based on transaction history in PDF format
    """
    # Validate date range
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Tanggal awal harus sebelum tanggal akhir")
    
    # Get transactions within date range
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).order_by(Transaction.date).all()
    
    # Calculate summary data
    total_income = sum(float(t.amount) for t in transactions if t.type == 'pemasukan')
    total_expense = sum(float(t.amount) for t in transactions if t.type == 'pengeluaran')
    net_balance = total_income - total_expense
    
    # Group by category
    categories = {}
    for tx in transactions:
        if tx.category not in categories:
            categories[tx.category] = 0
        categories[tx.category] += float(tx.amount)
    
    return generate_pdf_report(transactions, start_date, end_date, total_income, total_expense, net_balance, categories, current_user.name)

def generate_pdf_report(transactions, start_date, end_date, total_income, total_expense, net_balance, categories, user_name):
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        # Create PDF document
        doc = SimpleDocTemplate(tmp.name, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Add custom styles
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=1,  # Center
            spaceAfter=12
        )
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10
        )
        
        # Add title
        elements.append(Paragraph("LAPORAN KEUANGAN FINSIGHT", title_style))
        elements.append(Paragraph(f"Periode: {start_date} sampai {end_date}", styles['Normal']))
        elements.append(Paragraph(f"Nama: {user_name}", styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add summary section
        elements.append(Paragraph("Ringkasan", subtitle_style))
        summary_data = [
            ["Total Pemasukan:", f"Rp {total_income:,.2f}"],
            ["Total Pengeluaran:", f"Rp {total_expense:,.2f}"],
            ["Saldo Bersih:", f"Rp {net_balance:,.2f}"]
        ]
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Add category summary
        elements.append(Paragraph("Ringkasan Kategori", subtitle_style))
        category_data = [["Kategori", "Jumlah"]]
        for category, amount in categories.items():
            category_data.append([category, f"Rp {amount:,.2f}"])
        
        category_table = Table(category_data, colWidths=[3*inch, 2*inch])
        category_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(category_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Add transaction details
        elements.append(Paragraph("Detail Transaksi", subtitle_style))
        tx_data = [["Tanggal", "Tipe", "Kategori", "Deskripsi", "Jumlah (Rp)"]]
        
        for tx in transactions:
            amount_display = f'{float(tx.amount):,.2f}'
            if tx.type == 'pengeluaran':
                amount_display = f'-{amount_display}'
            
            tx_data.append([
                tx.date.strftime('%Y-%m-%d'),
                tx.type.capitalize(),
                tx.category,
                tx.description or '',
                amount_display
            ])
        
        # Create table with transaction data
        tx_table = Table(tx_data, colWidths=[0.9*inch, 0.9*inch, 1.2*inch, 2.2*inch, 1.3*inch])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ]))
        elements.append(tx_table)
        
        # Build PDF
        doc.build(elements)
        
    # Return the file
    headers = {
        'Content-Disposition': f'attachment; filename="FinSight_Laporan_{start_date}_sampai_{end_date}.pdf"'
    }
    
    return FileResponse(
        path=tmp.name,
        headers=headers,
        media_type='application/pdf',
        filename=f"FinSight_Laporan_{start_date}_sampai_{end_date}.pdf"
    )