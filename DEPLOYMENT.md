# Landscape Mastery — Production Deployment Guide

This document outlines the complete, step-by-step procedure to deploy the **Landscape Mastery** portal to production.

---

## 1. System Architecture

- **Frontend**: React 18 SPA built with Vite and Tailwind CSS.
- **Backend**: Django 5 REST Framework served via **Gunicorn** and **WhiteNoise** for static assets.
- **Database**: PostgreSQL 14+ (managed DB or Docker container).
- **Payment Gateway**: Razorpay (orders, signatures, webhooks).
- **Media & DRM**: Signed time-limited streaming URLs with dynamic student watermarking.

---

## 2. Environment Variables Checklist

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` / `SECRET_KEY` | **Yes** | 50+ character random cryptographic secret | `django-prod-k8x...` |
| `DEBUG` | **Yes** | Must be set to `False` in production | `False` |
| `ALLOWED_HOSTS` | **Yes** | Comma-separated list of server hostnames | `api.landscapemastery.com,localhost` |
| `CORS_ALLOWED_ORIGINS` | **Yes** | Comma-separated list of allowed frontend origins | `https://landscapemastery.com,https://www.landscapemastery.com` |
| `CSRF_TRUSTED_ORIGINS` | **Yes** | Comma-separated list of trusted origins for CSRF | `https://landscapemastery.com,https://api.landscapemastery.com` |
| `DATABASE_URL` | Optional* | Full PostgreSQL connection string (Railway/Render/Supabase) | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `DB_NAME` | Optional* | PostgreSQL database name (if `DATABASE_URL` not used) | `landscapemastery` |
| `DB_USER` | Optional* | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | Optional* | PostgreSQL password | `your_secure_password` |
| `DB_HOST` | Optional* | PostgreSQL host | `db.xyz.supabase.co` |
| `DB_PORT` | Optional* | PostgreSQL port | `5432` |
| `RAZORPAY_KEY_ID` | **Yes** | Live Razorpay Key ID | `rzp_live_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | **Yes** | Live Razorpay Key Secret | `your_razorpay_secret` |
| `EMAIL_HOST` | **Yes** | SMTP server address | `smtp.gmail.com` |
| `EMAIL_PORT` | **Yes** | SMTP port | `587` |
| `EMAIL_USE_TLS` | **Yes** | Enable TLS | `True` |
| `EMAIL_HOST_USER` | **Yes** | SMTP username / sender email | `contact@landscapemastery.com` |
| `EMAIL_HOST_PASSWORD` | **Yes** | SMTP app password | `your_app_password` |
| `DEFAULT_FROM_EMAIL` | **Yes** | Sender name and address | `Landscape Mastery <noreply@landscapemastery.com>` |
| `FRONTEND_URL` | **Yes** | Fully qualified URL of frontend for transactional emails | `https://landscapemastery.com` |
| `DB_CONN_MAX_AGE` | Optional | Persistent DB connection lifetime in seconds (default: 600) | `600` |
| `CONTACT_NOTIFICATION_EMAIL` | Optional | Admin recipient for contact submissions | `admin@landscapemastery.com` |
| `SECURE_SSL_REDIRECT` | Optional | Redirect HTTP to HTTPS (set `True` if no proxy redirect) | `True` |
| `SECURE_HSTS_SECONDS` | Optional | HTTP Strict Transport Security seconds | `31536000` |

*Either `DATABASE_URL` OR the individual `DB_*` variables must be provided.

### Frontend Environment Variables (`frontend/.env.production`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** (if separate domain) | Base URL of the backend API without trailing slash | `https://api.landscapemastery.com` |

*(If frontend and backend are served behind the same reverse proxy / domain under `/api`, leave `VITE_API_BASE_URL` blank).*

---

## 3. Automated Production Readiness Verification

Before cutting traffic to production, run the built-in system verification command:

```bash
# From repository root
npm run check:prod

# Or directly within backend directory
python manage.py check_production
```

This verifies:
- `DEBUG` is set to `False`
- `SECRET_KEY` meets 64+ char cryptographic length and entropy standards
- Database connection and queries are operating normally
- CORS and CSRF configurations are defined
- Razorpay live credentials are wired correctly
- SMTP outbound email is properly configured
- Static files build and storage manifests are present

### Backend Deployment (Render / Railway)
1. Link your Git repository.
2. Root directory: `backend`
3. Build command:
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
4. Start command:
   ```bash
   gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
   ```
   *(Or simply use the included `backend/Procfile`)*.
5. Add the backend environment variables listed in Section 2.
6. Verify deployment by visiting `https://your-api.domain.com/api/health/`. It will return:
   ```json
   {"status": "healthy", "database": "connected"}
   ```

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Link your Git repository.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-api.domain.com`
6. Add SPA rewrite rule (e.g. `vercel.json` or `_redirects` for Netlify):
   - For Netlify: `/* /index.html 200`
   - For Vercel: rewrite all routes to `/index.html`

---

## 4. Deployment Option B: Docker Compose (VPS / Self-Hosted)

A complete production `docker-compose.yml` is provided at the repository root.

1. **Clone the repository onto your server**:
   ```bash
   git clone <repo-url>
   cd LandscapeMastery
   ```

2. **Configure environment**:
   Copy `.env` values or create `.env` in the root:
   ```env
   JWT_SECRET=super_strong_production_secret_key_at_least_50_chars
   DB_PASSWORD=strong_postgres_password
   ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com,localhost
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com
   VITE_API_BASE_URL=https://api.yourdomain.com
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   ```

3. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Run migrations and create superuser**:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser
   ```

5. **Nginx Reverse Proxy**:
   Point your domain's reverse proxy (Nginx, Caddy, Cloudflare Tunnel, or Traefik) to:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

---

## 5. Post-Deployment Verification Checklist

1. [ ] **Health Endpoint**:
   Visit `https://api.yourdomain.com/api/health/` and confirm status 200 with `"database": "connected"`.
2. [ ] **Admin Login**:
   Visit `https://yourdomain.com/login` and verify administrative authentication with your superuser credentials.
3. [ ] **Static Assets**:
   Verify CSS, fonts, and images load with HTTP 200 and proper caching headers.
4. [ ] **Media Files**:
   Upload a test course cover or brand logo in the Admin Portal and verify it renders without broken image links.
5. [ ] **Razorpay Webhook**:
   In your Razorpay Dashboard, configure webhook URL:
   `https://api.yourdomain.com/api/webhook/razorpay/`
   Active events: `order.paid`, `payment.captured`, `payment.failed`.
6. [ ] **Signed Video Streaming**:
   Test a lecture stream from an enrolled account to verify signed stream tokens and dynamic student watermarking.
