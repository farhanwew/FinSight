# app/routers/community.py
from fastapi import APIRouter, Depends, HTTPException, File, Response, UploadFile, Form, status # Import status for HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from pathlib import Path
from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(
    prefix="/community",
    tags=["Community"]
)

# Pastikan direktori uploads ada
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/posts", response_model=schemas.CommunityPostResponse)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_url = None
    
    # Handle image upload
    if image and image.content_type.startswith('image/'):
        # Generate unique filename
        file_extension = image.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content_bytes = await image.read()
            buffer.write(content_bytes)
        
        image_url = f"/static/uploads/{unique_filename}"
    
    post_data = schemas.CommunityPostCreate(
        title=title,
        content=content,
        category=category,
        image_url=image_url
    )
    
    post = crud.create_community_post(db, post_data, current_user.id)
    
    # Return with user info
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "image_url": post.image_url,
        "category": post.category,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "created_at": post.created_at,
        "owner": {
            "id": current_user.id,
            "name": current_user.name
        }
    }

@router.get("/posts", response_model=List[schemas.CommunityPostResponse])
async def get_posts(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add authentication
):
    posts = crud.get_community_posts(db, skip, limit, category)
    
    result = []
    for post in posts:
        # Get user by ID
        user = db.query(User).filter(User.id == post.user_id).first()
        
        result.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_url": post.image_url,
            "category": post.category,
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "created_at": post.created_at,
            "owner": {
                "id": user.id,
                "name": user.name
            } if user else {"id": 0, "name": "Unknown"}
        })
    
    return result

@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = crud.get_community_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    is_liked = crud.like_post(db, post_id, current_user.id)
    return {"liked": is_liked, "post_id": post_id}

@router.post("/posts/{post_id}/comments", response_model=schemas.CommunityCommentResponse)
async def create_comment(
    post_id: int,
    comment: schemas.CommunityCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = crud.get_community_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_comment = crud.create_comment(db, comment, post_id, current_user.id)
    
    return {
        "id": db_comment.id,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "author": {
            "id": current_user.id,
            "name": current_user.name
        }
    }

@router.get("/posts/{post_id}/comments", response_model=List[schemas.CommunityCommentResponse])
async def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add authentication
):
    comments = crud.get_post_comments(db, post_id)
    
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        result.append({
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "author": {
                "id": user.id,
                "name": user.name
            } if user else {"id": 0, "name": "Unknown"}
        })
    
    return result

# New endpoint for deleting a community post
@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = crud.get_community_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Ensure only the owner can delete their post
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Optionally delete the image file if it exists
    if post.image_url and "static/uploads" in post.image_url:
        file_path = UPLOAD_DIR / post.image_url.split('/')[-1]
        if file_path.exists():
            os.remove(file_path)

    crud.delete_community_post(db, post_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)