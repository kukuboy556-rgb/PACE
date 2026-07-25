# PACE Deployment Guide (Free Tier)

Deploy PACE for a Philippine public school pilot at **zero cost** using free tiers.

## Architecture

```
Supabase ── PostgreSQL (database)
         ── Storage (file uploads, persistent)

Render Web Service ── Node.js Express (backend API)

Vercel ── React static site (frontend)
```

| Service | What it runs | Free tier limits |
|---------|-------------|------------------|
| **Supabase** | PostgreSQL + Storage | 500MB DB, 1GB storage, 50MB file size |
| **Render** | Node.js backend | 512MB RAM, sleeps after 15m idle |
| **Vercel** | React frontend | 100GB bandwidth, global CDN |
| **cron-job.org** | Keep backend awake | Unlimited free cron jobs |

**Total:** $0/mo

---

## Prerequisites

- [GitHub](https://github.com) account
- [Supabase](https://supabase.com) account (sign in with GitHub)
- [Render](https://render.com) account (sign in with GitHub)
- [Vercel](https://vercel.com) account (sign in with GitHub)
- [cron-job.org](https://cron-job.org) account (free, no payment needed)

---

## Step 1: Push code to GitHub

```bash
cd pace
git init
git add -A
git commit -m "Initial PACE scaffold"
git remote add origin https://github.com/YOUR_USERNAME/pace.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set up Supabase

### Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Fill in:
   - **Name**: `pace`
   - **Database Password**: save this somewhere
   - **Region**: *Singapore* (closest to PH, lowest latency)
3. Wait ~2 minutes for provisioning

### Get connection string

1. In your Supabase project, go to **Project Settings → Database → Connection string**
2. Select **URI** and copy the string
3. Replace `[YOUR-PASSWORD]` with your database password
4. It looks like: `postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres`

### Enable Storage

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `pace-uploads`
4. **Public bucket**: ON (so uploaded files can be viewed without auth)
5. Click **Create bucket**

### Get Storage keys

1. Go to **Project Settings → API**
2. Copy these (you'll need them later):
   - **Project URL** (e.g., `https://YOUR_REF.supabase.co`)
   - **Anon / Public key**
   - **Service role key** (keeps full access)

---

## Step 3: Deploy backend on Render

1. In [render.com](https://dashboard.render.com), click **New + → Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `pace-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: **Free**
4. Click **Advanced** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | Supabase connection string from Step 2 |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | *(set after Vercel deploy)* |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Service role key |
| `SUPABASE_STORAGE_BUCKET` | `pace-uploads` |

5. Click **Create Web Service**
6. Wait for build. Copy the URL: `https://pace-api.onrender.com`

### Run database migrations

1. In Render dashboard for your web service, go to **Shell** tab
2. Run:
```bash
npm run migrate
```
3. (Optional) Seed test accounts:
```bash
npm run seed
```

---

## Step 4: Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Add environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://pace-api.onrender.com` |

5. Click **Deploy**
6. After deployment, copy the URL: `https://pace-frontend.vercel.app`

---

## Step 5: Link frontend → backend

1. In Render dashboard for `pace-api`, go to **Environment**
2. Set `FRONTEND_URL` to `https://pace-frontend.vercel.app`
3. Click **Save Changes → Manual Deploy → Clear build cache & deploy**

---

## Step 6: Keep backend awake (free)

Render's free web service sleeps after **15 minutes** of inactivity.

1. Go to [cron-job.org](https://cron-job.org/en/members/cronjobs/)
2. Click **Create Cronjob**
3. Fill in:
   - **Title**: `PACE Keep Alive`
   - **URL**: `https://pace-api.onrender.com/api/auth/me`
   - **Schedule**: Every 10 minutes
4. Click **Create**

This pings the API every 10 minutes so the first user each morning doesn't wait 30s for wake-up.

---

## Step 7: Verify

Visit `https://pace-frontend.vercel.app` and log in:

| Email | Password | Role |
|-------|----------|------|
| admin@pace.edu.ph | admin123 | PDO (full access) |
| drrm@pace.edu.ph | admin123 | DRRM Coordinator |
| sbfp@pace.edu.ph | admin123 | SBFP Coordinator |
| infra@pace.edu.ph | admin123 | Infrastructure Coordinator |
| head@pace.edu.ph | admin123 | School Head (read-only) |

> **Change these passwords immediately** in production. Use `/api/auth/register` (PDO-only) to create real accounts, then delete seeded users.

---

## File uploads

Files are stored in **Supabase Storage** (persistent, survives redeploys). No special setup needed — the backend uses the `SUPABASE_*` env vars to upload files to Supabase automatically.

Files are served directly from Supabase's CDN, not from Render.

If you ever want to switch back to local disk storage, just remove the `SUPABASE_*` env vars and the backend falls back to `./uploads/` automatically.

---

## Daily backups

Supabase **automatically backs up** your database daily (included in free tier). You can restore from the Supabase dashboard:

**Project Settings → Database → Backups**

For an extra safeguard, add a GitHub Actions workflow (`.github/workflows/backup.yml`):

```yaml
name: Daily DB Backup
on:
  schedule:
    - cron: '0 22 * * *'  # 6am PH time
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: pg_dump "${{ secrets.DATABASE_URL }}" -f pace_backup.sql
      - uses: actions/upload-artifact@v4
        with:
          name: pace-backup
          path: pace_backup.sql
```

Add `DATABASE_URL` to your GitHub repo **Settings → Secrets and variables → Actions**.

---

## Cost breakdown

| Service | Cost | What you get |
|---------|------|-------------|
| Supabase | **$0** | 500MB PostgreSQL, 1GB file storage |
| Render | **$0** | 512MB RAM (sleeps on idle) |
| Vercel | **$0** | Static hosting, global CDN |
| cron-job.org | **$0** | Keep backend warm |
| GitHub | **$0** | Source + Actions for backup |
| **Total** | **$0/mo** | |

---

## Going beyond free

| Upgrade | Cost | Why |
|---------|------|-----|
| Render Web Service ($7/mo) | $7/mo | No sleeping, dedicated RAM |
| Supabase Pro ($25/mo) | $25/mo | 8GB DB, 100GB storage, daily backups |
| Custom domain | $0 | Vercel & Render both support free custom domains |

For a school pilot with 5-15 users, the free tier is sufficient. Only pay if adoption grows.

---

## Quick reference

```bash
# Local development
cd backend && npm run migrate   # Apply schema
cd backend && npm run seed      # Seed test users
cd backend && npm run dev       # Backend at :3001
cd frontend && npm run dev      # Frontend at :5173

# Production commands (via Render Shell)
node src/migrations/run.js      # Apply migrations
node src/seed.js                # Seed initial data
```

## Environment variables at a glance

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres
JWT_SECRET=random-32-byte-hex
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://pace-frontend.vercel.app
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=service-role-key-here
SUPABASE_STORAGE_BUCKET=pace-uploads
UPLOAD_DIR=./uploads             # fallback if SUPABASE vars not set
NODE_ENV=production
PORT=3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://pace-api.onrender.com
```
