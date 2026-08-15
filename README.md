# Landscape Mastery - Paid Educational Video Platform

A premium 3-screen web application and API service for **Landscape Mastery**, an executive educational platform for landscape architecture. Built with React 18, Tailwind CSS, Framer Motion spring physics, glassmorphic UI, and a Python Django 5.2 REST Framework backend.

---

## 📁 Repository Structure

```
LandscapeMastery/
├── frontend/                     # React 18 + Vite + Tailwind CSS + Framer Motion
│   ├── src/                      # Source code
│   │   ├── components/           # React UI Components
│   │   │   ├── Header.jsx        # Elevated Navigation Header & Logo
│   │   │   ├── LandingView.jsx   # Screen 1: Hero & Glass Checkout Card
│   │   │   ├── LoginView.jsx     # Screen 2: Strict Closed Access Login Portal
│   │   │   ├── DashboardView.jsx # Screen 3: Secure Video Dashboard
│   │   │   ├── Footer.jsx        # Footer Component
│   │   │   └── MagneticButton.jsx# Interactive Magnetic Spring CTA Button
│   │   ├── App.jsx               # View router container
│   │   ├── index.css             # Tailwind & Glassmorphism design tokens
│   │   └── main.jsx              # React Entrypoint
│   ├── public/                   # Static public assets (lm_logo.png)
│   ├── index.html                # Main HTML Document & Favicon
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite bundler config
│   ├── tailwind.config.js        # Custom Tailwind design tokens
│   └── postcss.config.js         # PostCSS configuration
│
├── backend/                      # Python Django 5.2 + Django REST Framework API
│   ├── api/                      # Django REST API app
│   │   ├── models.py             # CourseModule & Enrollment models
│   │   ├── views.py              # Login, Checkout & DRM Manifest views
│   │   ├── urls.py               # API endpoints (/api/auth/, /api/checkout/, /api/video/)
│   │   └── apps.py               # API AppConfig
│   ├── core/                     # Django core project configuration
│   │   ├── settings.py           # Settings & CORS config
│   │   ├── urls.py               # Root URLconf
│   │   ├── wsgi.py               # WSGI application
│   │   └── asgi.py               # ASGI application
│   ├── db.sqlite3                # SQLite database
│   ├── manage.py                 # Django command-line utility
│   └── requirements.txt          # Python dependencies (Django, DRF, PyJWT)
│
├── DESIGN.md                     # Stitch MCP Design Tokens specification
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Architecture documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: v3.10+ (Django 5.2, DRF, PyJWT)
- **Node.js**: v18+ (React, Vite, Tailwind, Framer Motion)

### Running Frontend & Backend Concurrently
From the root directory:

```bash
npm run dev
```

- **React Frontend**: `http://localhost:3000`
- **Django REST API**: `http://localhost:8000/api/health/`
