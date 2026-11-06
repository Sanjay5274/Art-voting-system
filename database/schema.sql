-- SCM Garments Pvt Ltd – Drawing Competition Database Schema
-- Database: Neon PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS drawings (
    id TEXT PRIMARY KEY,
    drawing_number VARCHAR(50) NOT NULL UNIQUE,
    drawing_title VARCHAR(255),
    image_path TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    liked_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawings_drawing_number ON drawings(drawing_number);
CREATE INDEX IF NOT EXISTS idx_drawings_votes ON drawings(votes DESC);
