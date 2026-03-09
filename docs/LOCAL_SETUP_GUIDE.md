# eRide — Local Setup Guide

## Prerequisites

- **Node.js** ≥ 18 (or Bun ≥ 1.0)
- **Docker Desktop** (for local Supabase)
- **Supabase CLI** (`npm i -g supabase`)
- **Git**

---

## 1. Clone & Install

```bash
git clone <your-repo-url> eride
cd eride
npm install          # or: bun install
```

## 2. Local Supabase (Docker)

```bash
supabase start       # spins up local Postgres, Auth, Storage, Edge Functions
```

This prints local credentials:

| Variable | Value |
|----------|-------|
| API URL | `http://127.0.0.1:54321` |
| Anon Key | *(printed in terminal)* |
| Service Role Key | *(printed in terminal)* |
| DB URL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## 3. Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-from-step-2>
VITE_SUPABASE_PROJECT_ID=local
```

## 4. Apply Migrations

```bash
supabase db reset    # applies all migrations in supabase/migrations/
```

Or apply the init schema manually:

```bash
psql $DB_URL -f docs/init.sql
```

## 5. Seed Edge Function Secrets (Local)

```bash
# Required for nearby-landmarks & predictive-eta
supabase secrets set GOOGLE_MAPS_API_KEY=<your-google-maps-key>

# Auto-provided by Lovable Cloud in production
supabase secrets set LOVABLE_API_KEY=<your-lovable-api-key>
```

## 6. Start Dev Server

```bash
npm run dev          # or: bun dev
```

App runs at **http://localhost:8080**

## 7. Run Edge Functions Locally

```bash
supabase functions serve --no-verify-jwt
```

## 8. Run Tests

```bash
npx vitest run
```

---

## Project Structure

```
src/
├── components/       # UI components (rider, driver, admin, safety, payments, etc.)
├── hooks/            # Custom React hooks (useAuth, useFareLock, etc.)
├── integrations/     # Auto-generated Supabase client & types
├── lib/              # Utilities (currency, receipt generation, ride logic)
├── pages/            # Route pages
└── assets/           # Vehicle images

supabase/
├── config.toml       # Supabase project config
├── functions/        # Edge Functions (Deno)
│   ├── nearby-landmarks/
│   ├── predictive-eta/
│   ├── ride-match/
│   └── support-chat/
└── migrations/       # SQL migration files
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query + React Context |
| Backend | Supabase (Postgres, Auth, Edge Functions) |
| AI | Lovable AI Gateway (Gemini models) |
| Payments | M-Pesa simulation (Edge Function ready) |
