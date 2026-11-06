

-- ArtVista Public Drawing Competition Voting Website
-- Database Schema for Neon PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for concurrent, atomic drawing number generation
CREATE SEQUENCE IF NOT EXISTS drawing_number_seq START WITH 1;

-- 1. Drawings Table
CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_number VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    drawing_title VARCHAR(255),
    category VARCHAR(100),
    image_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawings_drawing_number ON drawings(drawing_number);
CREATE INDEX IF NOT EXISTS idx_drawings_category ON drawings(category);
CREATE INDEX IF NOT EXISTS idx_drawings_created_at ON drawings(created_at DESC);

-- 2. Voting Tokens Table (Stores SHA-256 hash of single-use voting codes)
CREATE TABLE IF NOT EXISTS voting_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voting_tokens_hash ON voting_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_voting_tokens_used_at ON voting_tokens(used_at);

-- 3. Votes Table (One ballot per unique voting token)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_token_id UUID NOT NULL UNIQUE REFERENCES voting_tokens(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votes_token_id ON votes(voting_token_id);

-- 4. Vote Items Table (Selected drawings per ballot)
CREATE TABLE IF NOT EXISTS vote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_vote_drawing UNIQUE (vote_id, drawing_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_items_vote_id ON vote_items(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_items_drawing_id ON vote_items(drawing_id);

-- 5. Competition Settings Table
CREATE TABLE IF NOT EXISTS competition_settings (
    id SERIAL PRIMARY KEY,
    competition_name VARCHAR(255) NOT NULL DEFAULT 'ArtVista Annual Drawing Competition',
    max_selections INTEGER NOT NULL DEFAULT 3,
    voting_open BOOLEAN NOT NULL DEFAULT true,
    results_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial competition settings if empty
INSERT INTO competition_settings (id, competition_name, max_selections, voting_open, results_published)
VALUES (1, 'ArtVista Annual Drawing Competition', 3, true, false)
ON CONFLICT (id) DO NOTHING;
