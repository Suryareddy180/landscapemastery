# MIGRATION_PLAN.md — Codebase Consolidation: 3CAPSTECH into Landscape Mastery

This document establishes the architecture and execution plan for consolidating **3CAPSTECH** (`E:\projects\3capstech`) into **Landscape Mastery** (`E:\projects\LandscapeMastery`) as the single managed master application.

---

## 1. Project Overview & Architectures

### Project A: 3CAPSTECH (`E:\projects\3capstech`)
- **Type**: Official corporate website for 3CAPSTECH.
- **Frontend**: React 18.3.1 via Create React App (`react-scripts`), Tailwind CSS 3.4.7, Framer Motion 11.3, Lucide React icons, `react-router-dom` v6.
- **Backend**: Python Django 5.x REST Framework API with SimpleJWT authentication.
- **Database**: SQLite database (`backend/db.sqlite3`).
- **Core Functionality**:
  - Landing experience: Hero, About Us, 8 Service disciplines, Development Process, 11 Industries Served, 10 Enterprise Solutions, Products & Sub-Programs, Leadership Profiles, Testimonials, Contact Form & Lead Capture.
  - Company Admin Portal: JWT-authenticated dashboard managing Client Inquiries, Services, Enterprise Solutions, Products, Leadership Profiles, Testimonials, Newsletter Subscribers, and Brand Settings.

### Project B: Landscape Mastery (`E:\projects\LandscapeMastery`) — [MASTER DESTINATION]
- **Type**: Luxury educational & DRM streaming platform for Landscape Architecture and Gardening.
- **Frontend**: React 18.2 via Vite 5.1, Tailwind CSS 3.4.1, Framer Motion 13.1, Lucide React icons.
- **Backend**: Python Django 5.2 REST Framework API with custom token/JWT authentication, Razorpay payment gateway integration, SMTP mailer, and signed video URL streaming.
- **Database**: PostgreSQL (`landscapemastery` database).
- **Core Functionality**:
  - Public Platform: Hero, Multi-course catalog, Curriculum syllabus PDF viewer, Dynamic pricing, Accordion FAQs, Student Reviews, Checkout & Razorpay payment integration.
  - Student Portal: DRM video player with dynamic user-specific forensic watermark, course progress tracking, blueprint spec sheet downloads.
  - Executive Admin Operations Panel: Course & lesson builder, media asset manager, student enrollment roster, CSV export, live logo adjuster, audit logs, and analytics.

---

## 2. Architecture Comparison

| Dimension | 3CAPSTECH (`E:\projects\3capstech`) | Landscape Mastery (`E:\projects\LandscapeMastery`) | Unified Master Solution (`E:\projects\LandscapeMastery`) |
| :--- | :--- | :--- | :--- |
| **Codebase Role** | Source codebase (to be incorporated) | **Master Codebase** | `E:\projects\LandscapeMastery` |
| **Frontend Tooling** | Create React App (`react-scripts` 5.0) | Vite 5.1 (Fast ESM bundler) | **Vite 5.1** (Modern, fast, unified) |
| **Frontend Routing** | `react-router-dom` v6 (`Routes`, `Route`) | State-driven view switcher (`activeView`) | **Unified `react-router-dom` v6** supporting all routes and views |
| **Backend Framework**| Django 5.x + DRF | Django 5.2 + DRF | **Django 5.2 + DRF** in `LandscapeMastery/backend` |
| **Database Engine** | SQLite3 (`backend/db.sqlite3`) | PostgreSQL (`landscapemastery`) | **Unified PostgreSQL** (all data migrated seamlessly) |
| **Database Models** | 9 Models (`Contact`, `Product`, `Service`, `LeaderProfile`, `EnterpriseSolution`, etc.) | 14 Models (`Usr`, `Course`, `Module`, `Lesson`, `MediaAsset`, `Enrollment`, `PaymentRecord`, etc.) | **Dual Django App Architecture**: `api` (Landscape) + `company` (3CAPSTECH) in same DB |
| **Authentication** | Django SimpleJWT (`api/admin/login`) | Custom JWT Authentication (`api/login/`) | **Unified Auth System**: `api.Usr` serves as master model; SimpleJWT & custom token endpoints both supported |
| **Styling** | Tailwind CSS + CSS Variables (`Cabinet Grotesk`, `Satoshi`) | Tailwind CSS + Design Tokens (`Montserrat`, `Inter`) | **Merged Tailwind Config & CSS**: All custom fonts, utilities, and glassmorphism styles preserved |
| **Static Assets** | `public/logo.png`, `og-image.png`, `leaders/` | `public/lm_logo.png`, `course_thumb_*.jpg` | **Consolidated `public/` and `media/`** assets with zero filename collisions |
| **Build System** | `npm run build` | `npm run dev` (concurrently backend & frontend) | **Unified Monorepo Scripts** |

---

## 3. Conflict Analysis & Resolution

### A. Technology Conflicts
1. **Bundler (CRA vs Vite)**:
   - Solution: Use Vite. In `vite.config.js`, inject `define: { 'process.env.REACT_APP_BACKEND_URL': JSON.stringify('http://localhost:8000') }`. This ensures 3CAPSTECH components calling `process.env.REACT_APP_BACKEND_URL` continue working with zero code modifications.
2. **Icons & Animations**:
   - Both use `lucide-react` and `framer-motion`. Install `clsx` and `tailwind-merge` in LandscapeMastery frontend.

### B. File Conflicts
1. `src/App.jsx` vs `src/App.js`:
   - Solution: Unified `App.jsx` using `react-router-dom` v6.
2. `src/components/Footer.jsx`:
   - Keep Landscape Mastery footer at `components/Footer.jsx`.
   - Place 3CAPSTECH footer at `components/company/CompanyFooter.jsx`.
3. `src/components/MagneticButton.jsx`:
   - Identical physics component. Keep the enhanced version in `components/MagneticButton.jsx`.
4. `src/lib/api.js`:
   - Place into `src/lib/api.js` for 3CAPSTECH admin calls.

### C. Routing Conflicts
- `/` -> **Landscape Mastery Platform** (Hero, Catalog, Curriculum, Reviews, Pricing).
- `/company` -> **3CAPSTECH Company Website** (Hero, About, Services, Enterprise Solutions, Industries, Products, Leadership, Contact).
- Additional convenience routes: `/services`, `/about`, `/contact`, `/solutions` pointing to company sections.
- `/login` -> **Unified Login Page**.
- `/dashboard` -> **Student DRM Video Player**.
- `/admin` -> **Unified Admin Center** (Landscape Course Operations + 3CAPSTECH Company Operations).

### D. Database Conflicts
- 3CAPSTECH models will reside in a dedicated Django app: `backend/company/`.
- PostgreSQL tables will be prefixed with `company_` (`company_contact`, `company_product`, `company_service`, `company_leaderprofile`, `company_enterprisesolution`, `company_testimonial`, `company_websitesetting`, `company_newsletter`, `company_enrollment`).
- All existing data from `3capstech/backend/db.sqlite3` will be copied into PostgreSQL.

### E. Backend & API Conflicts
- Company public endpoints (`/api/services`, `/api/leaders`, `/api/solutions`, `/api/contact`, `/api/products`, `/api/newsletter`) have zero overlap with LandscapeMastery public endpoints (`/api/public/...`).
- Company admin endpoints will be routed without conflicting with LandscapeMastery admin endpoints.

---

## 4. Proposed Migration Strategy

1. **Pre-Migration Backups**: Create git migration branches on both repositories.
2. **Backend Consolidation**:
   - Add `Pillow`, `python-dotenv`, `rest_framework_simplejwt` to `requirements.txt`.
   - Create `backend/company/` app with models, serializers, views, and urls.
   - Register `'company'` in `settings.py`.
   - Apply migrations to PostgreSQL.
   - Migrate data from SQLite to PostgreSQL.
   - Copy media files (`leaders/`) to `LandscapeMastery/backend/media/leaders/`.
3. **Frontend Consolidation**:
   - Install `react-router-dom`, `clsx`, `tailwind-merge`.
   - Update `vite.config.js` and `index.html`.
   - Merge `tailwind.config.js` and `index.css`.
   - Copy 3CAPSTECH components into `src/components/company/`, `src/sections/`, `src/admin/`, `src/context/`, `src/lib/`, `src/pages/`.
   - Consolidate public assets into `public/`.
   - Wire unified `App.jsx` with routes and navigation bridges.
4. **Testing & Verification**:
   - Run production builds.
   - Verify all routes, APIs, and databases.
