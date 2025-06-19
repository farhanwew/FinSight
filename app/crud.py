# app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from passlib.context import CryptContext
from datetime import datetime, date, timedelta
from typing import Optional

from app.models import User, Transaction, CashFlowPrediction, BusinessRecommendation, CommunityPost, CommunityComment, CommunityLike
from app.schemas import UserCreate, TransactionCreate, CommunityPostCreate, CommunityCommentCreate

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

# Add these new functions
def update_user_profile(db: Session, user_id: int, name: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.name = name
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    return None

def change_user_password(db: Session, user_id: int, new_password: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.password_hash = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    return None

# Community CRUD operations
def create_community_post(db: Session, post: CommunityPostCreate, user_id: int):
    db_post = CommunityPost(
        user_id=user_id,
        title=post.title,
        content=post.content,
        category=post.category,
        image_url=post.image_url
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_community_posts(db: Session, skip: int = 0, limit: int = 20, category: Optional[str] = None):
    query = db.query(CommunityPost).filter(CommunityPost.is_active == True)
    if category:
        query = query.filter(CommunityPost.category == category)
    return query.order_by(CommunityPost.created_at.desc()).offset(skip).limit(limit).all()

def get_community_post(db: Session, post_id: int):
    return db.query(CommunityPost).filter(
        and_(CommunityPost.id == post_id, CommunityPost.is_active == True)
    ).first()

def like_post(db: Session, post_id: int, user_id: int):
    # Check if already liked
    existing_like = db.query(CommunityLike).filter(
        and_(CommunityLike.post_id == post_id, CommunityLike.user_id == user_id)
    ).first()
    
    if existing_like:
        # Unlike - remove the like
        db.delete(existing_like)
        
        # Decrease like count
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if post:
            post.likes_count = max(0, post.likes_count - 1)
        
        db.commit()
        return False
    else:
        # Like - add new like
        new_like = CommunityLike(post_id=post_id, user_id=user_id)
        db.add(new_like)
        
        # Increase like count
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if post:
            post.likes_count = post.likes_count + 1
        
        db.commit()
        return True

def create_comment(db: Session, comment: CommunityCommentCreate, post_id: int, user_id: int):
    db_comment = CommunityComment(
        post_id=post_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(db_comment)
    
    # Update comment count
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if post:
        post.comments_count = post.comments_count + 1
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_post_comments(db: Session, post_id: int):
    return db.query(CommunityComment).filter(
        CommunityComment.post_id == post_id
    ).order_by(CommunityComment.created_at.asc()).all()



# New function to delete a community post
def delete_community_post(db: Session, post_id: int):
    # Delete associated comments first
    db.query(CommunityComment).filter(CommunityComment.post_id == post_id).delete()
    # Delete associated likes
    db.query(CommunityLike).filter(CommunityLike.post_id == post_id).delete()
    
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if post:
        db.delete(post)
        db.commit()
        return True
    return False