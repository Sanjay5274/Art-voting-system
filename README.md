# ArtVista – Public Drawing Competition Voting Website

ArtVista is a responsive, public drawing competition voting platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Neon PostgreSQL**, and **Supabase Storage**.

It allows company directors and visitors to browse 60+ student drawings and cast confidential votes using **single-use voting codes** without creating accounts or logging in.

---

## 🎨 Key Features & Architecture

### 1. No Login / No Accounts Required
- **Zero user registration**: There are no director accounts, registration screens, or password requirements.
- **Single-Use Voting Codes**: Each company director is given a unique, single-use voting code (e.g. `VOTE-A7F2-9K3P`).
- **Cryptographic Security**: Only SHA-256 hashes of voting codes are stored in PostgreSQL. Plaintext codes are never stored.
- **Atomic Ballot Submissions**: A code can only be used once. Atomic database transactions prevent duplicate submissions and race conditions.

### 2. Public Gallery & Ballot Selection
- **Public Browsing (`/`)**: Displays 60+ student drawings in a responsive grid.
- **Strict Privacy**: Student names are strictly omitted from public views to prevent voting bias.
- **Multiple-Choice Ballot**: Directors can select up to the configured limit (default: 3 favourite drawings) with visual highlights.
- **Sticky Ballot Bar**: Shows live selection count, artwork thumbnails, and a button to submit.
- **Full-Size Inspection Modal**: High-resolution artwork preview before casting a vote.

### 3. Secret-Protected Organizer Portal (`/organizer`)
- **Protected by `ORGANIZER_SECRET`**: Zero exposure of privileged keys in client-side code.
- **Bulk Upload (`/organizer/upload`)**: Upload 60+ drawings simultaneously directly into Supabase Storage with 5 concurrent workers, live progress, previews, retry logic, and orphan cleanup.
- **Voting Codes Generator (`/organizer/codes`)**: Generate single-use voting codes in batches (e.g., 20, 50, 100) with one-click copy and `.txt` export.
- **Official Results & Leaderboard (`/organizer/results`)**:
  - Full leaderboard with student names and tied-rank handling (equal votes share ranks).
  - Top 3 winners podium.
  - One-click CSV export.
  - Toggle to open/close voting and publish results to the public.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Backend | Next.js API Routes / Route Handlers |
| Database | Neon PostgreSQL (`@neondatabase/serverless`) |
| Image Storage | Supabase Storage (`drawings` bucket) |
| Deployment | Vercel (manual deployment) |

---

## 📋 Database Schema

Execute [`database/schema.sql`](./database/schema.sql) in your Neon PostgreSQL console:

- `drawings`: `id`, `drawing_number` (unique, e.g. `DRW-001`), `student_name`, `drawing_title`, `category`, `image_path`, `created_at`.
- `voting_tokens`: `id`, `token_hash` (unique SHA-256 hash), `used_at`, `created_at`.
- `votes`: `id`, `voting_token_id` (unique FK), `submitted_at`.
- `vote_items`: `id`, `vote_id` (FK), `drawing_id` (FK), `UNIQUE(vote_id, drawing_id)`.
- `competition_settings`: `id`, `competition_name`, `max_selections` (default 3), `voting_open`, `results_published`, timestamps.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:

```env
# Neon PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Supabase Storage Configuration (Storage only, no Supabase Auth or DB)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Secret used to access /organizer pages
ORGANIZER_SECRET=artvista-organizer-secret-key-2026

# Secret salt used for hashing voting codes
VOTING_CODE_GENERATION_SECRET=artvista-voting-secret-salt-2026
```

---

## 🚀 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run database migrations**:
   Execute [`database/schema.sql`](./database/schema.sql) in Neon SQL Editor.

3. **Generate initial voting codes (CLI)**:
   ```bash
   node scripts/generate-codes.js 20
   ```
   *(Or generate codes directly in the browser via `/organizer/codes`)*

4. **Start development server**:
   ```bash
   npm run dev
   ```
   - Public Website: [http://localhost:3000](http://localhost:3000)
   - Organizer Portal: [http://localhost:3000/organizer](http://localhost:3000/organizer)

5. **Run test suite**:
   ```bash
   npm test
   ```

---

## 🚢 Manual Vercel Deployment

1. Push your repository to GitHub / GitLab.
2. In [Vercel](https://vercel.com), click **Add New Project** and select this repo.
3. In **Environment Variables**, provide:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ORGANIZER_SECRET`
   - `VOTING_CODE_GENERATION_SECRET`
4. Deploy the application.

---

## 🧪 Verification Checklist

- [x] **No Login Required**: Public visitors can browse all drawings without accounts or login.
- [x] **Privacy Guaranteed**: Student names are strictly excluded from public APIs and gallery cards.
- [x] **Single-Use Voting Codes**: Codes are hashed with SHA-256; database atomic updates prevent code reuse.
- [x] **Configurable Ballot Limits**: Enforces selection limit (`max_selections`) both in UI and on the server.
- [x] **Duplicate Ballot Prevention**: Unique constraint on `votes.voting_token_id` and atomic claims prevent double voting.
- [x] **Tied Ranks**: Equal vote counts share rank; subsequent ranks skip accordingly (1224 competition style).
- [x] **Controlled 5-Worker Bulk Upload**: Fast direct-to-storage upload for 60+ images with automatic orphan cleanup.
- [x] **Results Visibility Control**: Results stay hidden until the organizer explicitly toggles "Publish Results".
- [x] **CSV Export**: Clean download of voting results for the organizer.
