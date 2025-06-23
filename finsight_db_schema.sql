-- Database Schema untuk FinSight
-- Menggunakan PostgreSQL (dapat diadaptasi untuk SQLite)

-- Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Business Recommendations (untuk menyimpan rekomendasi yang di-generate)
CREATE TABLE business_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    modal DECIMAL(15,2) NOT NULL,
    minat VARCHAR(255),
    lokasi VARCHAR(100),
    recommendations JSONB, -- Menyimpan array rekomendasi dalam format JSON
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Cash Flow Predictions
CREATE TABLE cash_flow_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    predicted_income DECIMAL(15,2),
    predicted_expense DECIMAL(15,2),
    prediction_date DATE NOT NULL,
    insight TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Feasibility Analysis
CREATE TABLE feasibility_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    modal_awal DECIMAL(15,2) NOT NULL,
    biaya_operasional DECIMAL(15,2) NOT NULL,
    estimasi_pemasukan DECIMAL(15,2) NOT NULL,
    profit_bersih DECIMAL(15,2),
    roi DECIMAL(5,2),
    break_even_months INTEGER,
    feasibility_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Community Posts
CREATE TABLE community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(50) NOT NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Community Comments
CREATE TABLE community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Community Likes
CREATE TABLE community_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id) -- Prevent duplicate likes from same user
);

-- Index untuk performa query
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_business_recommendations_user_id ON business_recommendations(user_id);
CREATE INDEX idx_cash_flow_predictions_user_id ON cash_flow_predictions(user_id);
CREATE INDEX idx_feasibility_analyses_user_id ON feasibility_analyses(user_id);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX idx_community_likes_user_id ON community_likes(user_id);

-- -- Sample data untuk testing
-- INSERT INTO users (name, email, password_hash) VALUES 
-- ('Jolly Watson', 'user@finsight.com', '$2b$12$example_hashed_password'),
-- ('Test User', 'test@example.com', '$2b$12$example_hashed_password2');

-- INSERT INTO transactions (user_id, date, type, amount, category, description) VALUES 
-- (1, '2025-05-05', 'pemasukan', 5000000, 'Penjualan Produk', 'Penjualan batch 1'),
-- (1, '2025-05-10', 'pengeluaran', 1500000, 'Bahan Baku', 'Beli kain katun'),
-- (1, '2025-05-15', 'pengeluaran', 500000, 'Pemasaran', 'Iklan media sosial'),
-- (1, '2025-06-01', 'pemasukan', 7500000, 'Penjualan Produk', 'Penjualan batch 2'),
-- (1, '2025-06-03', 'pengeluaran', 2000000, 'Bahan Baku', 'Beli kain sutra'),
-- (1, '2025-06-08', 'pengeluaran', 750000, 'Gaji', 'Gaji 1 Karyawan');