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

-- Index untuk performa query
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_business_recommendations_user_id ON business_recommendations(user_id);
CREATE INDEX idx_cash_flow_predictions_user_id ON cash_flow_predictions(user_id);
CREATE INDEX idx_feasibility_analyses_user_id ON feasibility_analyses(user_id);

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