# 🌿 Landscape Mastery — Executive Architecture Platform

A high-converting, motion-driven web application and DRM video platform for **Landscape Mastery**.

Built as a production-grade monorepo featuring a **React 18 + Tailwind CSS + Framer Motion** frontend and a **Python Django 5.2 + Django REST Framework** backend powered by **PostgreSQL** and **Razorpay Payment Gateway**.

---

## 📐 Architecture & Directory Structure

```
landscapemastery/
├── frontend/                     # React 18 + Vite + Tailwind CSS App
│   ├── public/                   # Public static assets (lm_logo.png)
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── Header.jsx        # Glassmorphic elevated header with brand logo
│   │   │   ├── LandingView.jsx   # Hero section & Razorpay Checkout Card
│   │   │   ├── LoginView.jsx     # Restricted access login card
│   │   │   ├── DashboardView.jsx # DRM video player portal with dynamic watermark
│   │   │   └── MagneticButton.jsx# Framer Motion spring physics button
│   │   ├── App.jsx               # Navigation router container
│   │   ├── index.css             # Design tokens & glassmorphic utilities
│   │   └── main.jsx              # React entry point
│   ├── index.html                # HTML entry with Google Fonts & Razorpay SDK
│   ├── package.json              # Frontend dependencies
│   ├── tailwind.config.js        # Stitch design token rules
│   └── vite.config.js            # Vite bundler setup
│
├── backend/                      # Python Django 5.2 + Django REST Framework API
│   ├── api/                      # Django REST API app
│   │   ├── models.py             # CourseModule & Enrollment models
│   │   ├── views.py              # Login, Checkout & DRM Manifest views
│   │   ├── email_service.py      # Django SMTP email notification service
│   │   ├── urls.py               # API endpoints (/api/auth/, /api/checkout/, /api/video/)
│   │   └── apps.py               # API AppConfig
│   ├── core/                     # Django core project configuration
│   │   ├── settings.py           # PostgreSQL DB & Django SMTP settings
│   │   ├── urls.py               # Root URLconf
│   │   ├── wsgi.py               # WSGI application
│   │   └── asgi.py               # ASGI application
│   ├── manage.py                 # Django command-line utility
│   ├── requirements.txt          # Python dependencies (Django, DRF, PyJWT, psycopg2-binary)
│   └── .env.example              # Environment variables template
│
├── DESIGN.md                     # Stitch MCP Design Tokens specification
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Architecture documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: v3.10+ (Django 5.2, DRF, PyJWT, psycopg2-binary)
- **Node.js**: v18+ (React, Vite, Tailwind, Framer Motion)
- **PostgreSQL**: v13+ (Database Engine)

### Running Frontend & Backend Concurrently
From the root directory:

```bash
npm run dev
```

- **React Frontend**: `http://localhost:3000`
- **Django REST API**: `http://localhost:8000/api/health/`
