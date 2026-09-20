# DATABASE_MIGRATION_PLAN.md — Database Consolidation Strategy

This document details the database migration strategy for consolidating **3CAPSTECH** (`E:\projects\3capstech`) into **Landscape Mastery** (`E:\projects\LandscapeMastery`).

---

## 1. Current Database Inventory

### Landscape Mastery (`E:\projects\LandscapeMastery`)
- **Engine**: PostgreSQL (`landscapemastery`) on `localhost:5432`
- **Django App**: `api`
- **Existing Tables**:
  - `api_usr` (Custom user model with roles: `SUPER_ADMIN`, `CONTENT_MANAGER`, `SUPPORT_ADMIN`, `STUDENT`)
  - `api_category`
  - `api_instructor`
  - `api_course`
  - `api_module`
  - `api_lesson`
  - `api_mediaasset`
  - `api_contentitem`
  - `api_enrollment`
  - `api_lessonprogress`
  - `api_videoprogress`
  - `api_paymentrecord`
  - `api_coupon`
  - `api_testimonial`
  - `api_faq`
  - `api_announcement`
  - `api_sitesetting`
  - `api_auditlog`

### 3CAPSTECH (`E:\projects\3capstech`)
- **Engine**: SQLite3 (`backend/db.sqlite3`)
- **Django App**: `api`
- **Existing Tables & Row Counts**:
  - `api_contact`: 2 rows
  - `api_enterprisesolution`: 10 rows
  - `api_leaderprofile`: 1 row
  - `api_product`: 4 rows
  - `api_service`: 0 rows (uses static fallback when empty)
  - `api_testimonial`: 0 rows (uses static fallback when empty)
  - `api_websitesetting`: 0 rows
  - `api_newsletter`: 0 rows
  - `api_enrollment`: 0 rows

---

## 2. Collision Analysis & Risk Mitigation

| 3CAPSTECH Model | LandscapeMastery Model | Collision Type | Resolution |
| :--- | :--- | :--- | :--- |
| `Enrollment` | `Enrollment` | Python Class & Table Name Collision | Place 3CAPSTECH models in dedicated Django app `company`. Model becomes `CompanyEnrollment`. Table becomes `company_enrollment`. |
| `Testimonial` | `Testimonial` | Python Class & Table Name Collision | 3CAPSTECH model becomes `CompanyTestimonial`. Table becomes `company_testimonial`. |
| `WebsiteSetting` | `SiteSetting` | Conceptual overlap, schema difference | 3CAPSTECH model becomes `CompanyWebsiteSetting`. Table becomes `company_websitesetting`. |
| `Product` | N/A | None | Placed in `company` app. Table: `company_product`. |
| `Service` | N/A | None | Placed in `company` app. Table: `company_service`. |
| `LeaderProfile` | N/A | None | Placed in `company` app. Table: `company_leaderprofile`. |
| `EnterpriseSolution` | N/A | None | Placed in `company` app. Table: `company_enterprisesolution`. |
| `Contact` | N/A | None | Placed in `company` app. Table: `company_contact`. |
| `Newsletter` | N/A | None | Placed in `company` app. Table: `company_newsletter`. |

---

## 3. Database Strategy: Unified PostgreSQL

We choose **Option A: Unified Database** inside PostgreSQL because:
1. Both projects use Django ORM.
2. PostgreSQL easily accommodates both apps (`api` for Landscape Mastery and `company` for 3CAPSTECH) under separate table prefixes.
3. Eliminates multi-database connection routing complexity and cross-database transaction issues.
4. Total database safety: No existing PostgreSQL tables are modified or dropped.

---

## 4. Data Migration Script Specification

A standalone Python migration script (`migrate_sqlite_to_pg.py`) will:
1. Connect to `E:/projects/3capstech/backend/db.sqlite3` via `sqlite3`.
2. Connect to `landscapemastery` PostgreSQL via `psycopg2`.
3. Transfer:
   - All 10 `EnterpriseSolution` records (School ERP, Hospital Management, CRM, etc.)
   - The `LeaderProfile` record (`KB Reddy`, Founder & CEO)
   - All 4 `Product` records (`Landscape Mastery`, `Sub Program Alpha`, `Beta Website Initiative`, `Gamma Internal Tools`)
   - All 2 `Contact` inquiries
4. Verify record counts in PostgreSQL after transfer.
5. Zero data loss.
