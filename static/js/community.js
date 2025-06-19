// static/js/community.js
import { communityAPI } from './api.js';
import { showMessage, getTimeAgo, getCategoryColor, getCategoryLabel, currentUserName, currentUserId, DOMElements } from './utils.js'; // Import currentUserId

const communityPostForm = DOMElements.communityPostForm || document.getElementById('community-post-form');
const communityPostsContainer = DOMElements.communityPostsContainer || document.getElementById('community-posts-container');
const filterButtons = DOMElements.filterButtons || document.querySelectorAll('.filter-btn');
const createPostBtn = DOMElements.createPostBtn || document.getElementById('create-post-btn');
const createPostModal = DOMElements.createPostModal || document.getElementById('create-post-modal');
const closeModalBtn = DOMElements.closeModalBtn || document.getElementById('close-modal-btn');
const cancelPostBtn = DOMElements.cancelPostBtn || document.getElementById('cancel-post-btn');

export const setupCommunityListeners = () => {
    createPostBtn.addEventListener('click', () => {
        createPostModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        createPostModal.classList.add('hidden');
        communityPostForm.reset();
    });

    cancelPostBtn.addEventListener('click', () => {
        createPostModal.classList.add('hidden');
        communityPostForm.reset();
    });

    createPostModal.addEventListener('click', (e) => {
        if (e.target === createPostModal) {
            createPostModal.classList.add('hidden');
            communityPostForm.reset();
        }
    });

    communityPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('post-title').value);
        formData.append('content', document.getElementById('post-content').value);
        formData.append('category', document.getElementById('post-category').value);
        
        const imageFile = document.getElementById('post-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await communityAPI.createPost(formData);

            if (response.ok) {
                showMessage('Post berhasil dibagikan!', 'success');
                communityPostForm.reset();
                createPostModal.classList.add('hidden');
                loadCommunityPosts();
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Gagal membagikan post.', 'error');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            showMessage('Terjadi kesalahan saat membagikan post.', 'error');
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('bg-indigo-600', 'text-white');
                b.classList.add('bg-slate-700', 'text-slate-300');
            });
            btn.classList.remove('bg-slate-700', 'text-slate-300');
            btn.classList.add('bg-indigo-600', 'text-white');
            
            loadCommunityPosts(btn.dataset.category);
        });
    });

    communityPostsContainer.addEventListener('click', async (e) => {
        const postCard = e.target.closest('.post-card');
        if (!postCard) return;
        
        const postId = postCard.dataset.postId;
        
        if (e.target.closest('.like-btn')) {
            e.preventDefault();
            try {
                const response = await communityAPI.toggleLike(postId);
                
                if (response.ok) {
                    const data = await response.json();
                    const likeBtn = e.target.closest('.like-btn');
                    const heartIcon = likeBtn.querySelector('svg');
                    const countSpan = likeBtn.querySelector('.like-count'); 
                    
                    if (heartIcon && countSpan) { 
                        if (data.liked) {
                            heartIcon.classList.add('fill-current', 'text-red-400');
                            likeBtn.classList.remove('text-slate-400');
                            likeBtn.classList.add('text-red-400');
                            countSpan.textContent = parseInt(countSpan.textContent) + 1;
                        } else {
                            heartIcon.classList.remove('fill-current', 'text-red-400');
                            likeBtn.classList.remove('text-red-400');
                            likeBtn.classList.add('text-slate-400');
                            countSpan.textContent = parseInt(countSpan.textContent) - 1;
                        }
                    } else {
                        console.warn("Could not find heart icon (SVG) or like count span for post ID:", postId);
                    }
                } else {
                    showMessage('Gagal memberikan like.', 'error');
                }
            } catch (error) {
                console.error('Error toggling like:', error);
                showMessage('Terjadi kesalahan saat memberikan like.', 'error');
            }
        }
        
        if (e.target.closest('.comment-btn')) {
            e.preventDefault();
            const commentsSection = postCard.querySelector('.comments-section');
            commentsSection.classList.toggle('hidden');
            
            if (!commentsSection.classList.contains('hidden')) {
                loadComments(postId, commentsSection.querySelector('.comments-list'));
            }
        }
        
        if (e.target.closest('.submit-comment-btn')) {
            e.preventDefault();
            const commentInput = postCard.querySelector('.comment-input');
            const content = commentInput.value.trim();
            
            if (!content) {
                showMessage('Komentar tidak boleh kosong.', 'error');
                return;
            }
            
            try {
                const response = await communityAPI.createComment(postId, content);
                
                if (response.ok) {
                    commentInput.value = '';
                    const commentsSection = postCard.querySelector('.comments-section');
                    loadComments(postId, commentsSection.querySelector('.comments-list'));
                    
                    const commentCountSpan = postCard.querySelector('.comment-count');
                    if (commentCountSpan) { 
                        commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;
                    }
                    
                    showMessage('Komentar berhasil ditambahkan!', 'success');
                } else {
                    const errorData = await response.json();
                    showMessage(errorData.detail || 'Gagal menambahkan komentar.', 'error');
                }
            } catch (error) {
                console.error('Error adding comment:', error);
                showMessage('Terjadi kesalahan saat menambahkan komentar.', 'error');
            }
        }

        // Handle delete button
        if (e.target.closest('.delete-post-btn')) {
            e.preventDefault();
            const isConfirmed = confirm('Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak dapat dibatalkan.');
            if (isConfirmed) {
                try {
                    const response = await communityAPI.deletePost(postId);
                    if (response.ok) {
                        showMessage('Post berhasil dihapus!', 'success');
                        loadCommunityPosts(); // Reload posts after deletion
                    } else {
                        const errorData = await response.json();
                        showMessage(errorData.detail || 'Gagal menghapus post.', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    showMessage('Terjadi kesalahan saat menghapus post.', 'error');
                }
            }
        }
    });

    communityPostsContainer.addEventListener('keypress', (e) => {
        if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
            e.preventDefault();
            const postCard = e.target.closest('.post-card');
            const submitBtn = postCard.querySelector('.submit-comment-btn');
            if (submitBtn) { 
                submitBtn.click();
            }
        }
    });
};

export const loadCommunityPosts = async (category = '') => {
    try {
        const response = await communityAPI.getPosts(category);

        if (response.ok) {
            const posts = await response.json();
            renderCommunityPosts(posts);
        } else {
            showMessage('Gagal memuat post komunitas.', 'error');
        }
    } catch (error) {
        console.error('Error loading community posts:', error);
        showMessage('Terjadi kesalahan saat memuat post komunitas.', 'error');
    }
};

const renderCommunityPosts = (posts) => {
    if (!posts || posts.length === 0) {
        communityPostsContainer.innerHTML = `
            <div class="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <i data-lucide="message-circle" class="mx-auto mb-2 text-slate-400"></i>
                <p class="text-slate-400">Belum ada post di kategori ini. Jadilah yang pertama untuk berbagi!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const postsHTML = posts.map(post => {
        // Add debugging to see what format the date is in
        console.log('Post created_at:', post.created_at);
        
        // Create a proper date object with explicit parsing
        const postDate = new Date(post.created_at);
        console.log('Parsed post date:', postDate);
        
        const timeAgo = getTimeAgo(postDate);
        const categoryColor = getCategoryColor(post.category);
        const isOwner = post.owner.id === currentUserId; // Check if the current user is the owner
        
        return `
            <div class="bg-slate-800 p-6 rounded-lg shadow-lg post-card mb-6" data-post-id="${post.id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <img src="https://placehold.co/48x48/6366f1/ffffff?text=${post.owner.name.charAt(0).toUpperCase()}" class="rounded-full w-12 h-12" alt="${post.owner.name}">
                        <div>
                            <p class="font-semibold text-indigo-300">${post.owner.name}</p>
                            <p class="text-xs text-slate-400">${timeAgo}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 text-xs rounded-full ${categoryColor}">${getCategoryLabel(post.category)}</span>
                        ${isOwner ? `
                            <button class="delete-post-btn text-red-400 hover:text-red-600 transition-colors" title="Hapus Post">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <h4 class="font-bold text-lg mb-3">${post.title}</h4>
                <p class="text-slate-300 mb-4 leading-relaxed">${post.content}</p>
                
                ${post.image_url ? `
                    <div class="mb-6">
                        <img src="${post.image_url}" class="max-w-lg w-full h-auto object-cover rounded-lg border border-slate-600 mx-auto" alt="Post image">
                    </div>
                ` : ''}
                
                <div class="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div class="flex items-center space-x-6">
                        <button class="like-btn flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors" data-post-id="${post.id}">
                            <i data-lucide="heart" class="w-5 h-5"></i>
                            <span class="like-count">${post.likes_count}</span>
                        </button>
                        <button class="comment-btn flex items-center space-x-2 text-slate-400 hover:text-indigo-400 transition-colors" data-post-id="${post.id}">
                            <i data-lucide="message-circle" class="w-5 h-5"></i>
                            <span class="comment-count">${post.comments_count}</span>
                        </button>
                    </div>
                </div>
                
                <div class="comments-section hidden mt-6 pt-6 border-t border-slate-700">
                    <div class="comments-list mb-6 max-h-80 overflow-y-auto pr-2 space-y-4"></div>
                    <div class="flex space-x-3 bg-slate-700 p-4 rounded-lg">
                        <img src="https://placehold.co/36x36/6366f1/ffffff?text=${currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}" class="rounded-full w-9 h-9 flex-shrink-0" alt="Your avatar">
                        <div class="flex-1 flex space-x-2">
                            <input type="text" class="comment-input flex-1 bg-slate-600 border border-slate-500 rounded-md p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tulis komentar..." data-post-id="${post.id}">
                            <button class="submit-comment-btn bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-md text-sm transition-colors duration-200" data-post-id="${post.id}">
                                <i data-lucide="send" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    communityPostsContainer.innerHTML = postsHTML;
    lucide.createIcons();
};

const loadComments = async (postId, container) => {
    try {
        const response = await communityAPI.getComments(postId);
        
        if (response.ok) {
            const comments = await response.json();
            renderComments(comments, container);
        } else {
            container.innerHTML = '<p class="text-slate-400 text-sm">Gagal memuat komentar.</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p class="text-slate-400 text-sm">Terjadi kesalahan saat memuat komentar.</p>';
    }
};

const renderComments = (comments, container) => {
    if (comments.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Belum ada komentar. Jadilah yang pertama berkomentar!</p>';
        return;
    }
    
    const commentsHTML = comments.map(comment => {
        const timeAgo = getTimeAgo(new Date(comment.created_at));
        return `
            <div class="flex space-x-3">
                <img src="https://placehold.co/40x40/6366f1/ffffff?text=${comment.author.name.charAt(0).toUpperCase()}" class="rounded-full w-10 h-10 flex-shrink-0" alt="${comment.author.name}">
                <div class="flex-1">
                    <div class="bg-slate-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <p class="font-semibold text-sm text-indigo-300">${comment.author.name}</p>
                            <p class="text-xs text-slate-500">${timeAgo}</p>
                        </div>
                        <p class="text-sm text-slate-200 leading-relaxed">${comment.content}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = commentsHTML;
};