# IT Asset Management System (ITAM)

A full-stack web application for managing IT assets, software licenses, employees, and organizational entities — with role-based access, AI-powered insights, scheduled reports, and compliance controls.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project Structure](#4-project-structure)
5. [Database Setup](#5-database-setup)
6. [Backend Setup](#6-backend-setup)
7. [Frontend Setup](#7-frontend-setup)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Google OAuth Setup](#9-google-oauth-setup)
10. [Running the Application](#10-running-the-application)
11. [API Reference](#11-api-reference)
12. [Database Schema](#12-database-schema)
13. [Authentication & Authorization](#13-authentication--authorization)
14. [Frontend Routes](#14-frontend-routes)
15. [Key Features](#15-key-features)
16. [Docker / DevOps](#16-docker--devops)
17. [Default Credentials](#17-default-credentials)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              React 18 + Vite (port 5173)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JSON)
                           │ Authorization: Bearer <JWT>
                           │ X-Entity-Code: <entityCode>
┌──────────────────────────▼──────────────────────────────────┐
│               Node.js + Express (port 5000)                 │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth MW  │  │ Role Guard   │  │  Entity Access MW    │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Route Handlers                      │   │
│  │  /api/auth  /api/assets  /api/employees  /api/users  │   │
│  │  /api/software  /api/licenses  /api/system-prefs     │   │
│  │  /api/ai  /api/report-schedules  ... (22 modules)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Sequelize ORM (MySQL2 driver)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  MySQL 8.x Database                         │
│                  Database: itamdb                           │
│                                                             │
│  Users · Assets · Employees · Entities · Roles             │
│  SoftwareLicenses · SoftwareAssignments · Licenses         │
│  Departments · Locations · AssetCategories                 │
│  AuditLogs · SystemPreferences · EmailSettings             │
│  ReportSchedules · AlertRules · ... (21 tables)            │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Entity Architecture

Each entity (company/subsidiary) has its own **tenant database** (`itamdb_<entityCode>`) for assets, employees, departments, and locations. The main `itamdb` database holds shared data (users, roles, system preferences, etc.). The `X-Entity-Code` HTTP header routes every request to the correct tenant.

---

## 2. Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | ≥18.x | Runtime |
| Express | ^4.19 | HTTP framework |
| Sequelize | ^6.37 | ORM |
| mysql2 | ^3.9 | MySQL driver |
| bcryptjs | ^2.4 | Password hashing (salt rounds: 12) |
| jsonwebtoken | ^9.0 | JWT auth tokens |
| google-auth-library | ^10.6 | Google OAuth token verification |
| nodemailer | ^7.0 | Email delivery |
| pdfkit | ^0.17 | PDF report generation |
| xlsx | ^0.18 | Excel import/export |
| multer | ^1.4 | File upload handling |
| sharp | ^0.34 | Image processing (logos) |
| node-cron | ^4.2 | Scheduled report jobs |
| dotenv | ^16.4 | Environment variables |
| nodemon | ^3.1 | Dev auto-reload |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.2 | UI framework |
| React Router DOM | ^6.22 | Client-side routing |
| Vite | ^5.4 | Build tool & dev server |
| Chart.js + react-chartjs-2 | ^4.5 / ^5.3 | Charts & graphs |
| @react-oauth/google | ^0.13 | Google Sign-In button |
| Lucide React | ^0.562 | Icon library |
| React Icons | ^5.5 | Additional icons |
| @fortawesome/fontawesome-free | ^7.1 | Font Awesome icons |
| Tailwind CSS | ^4.1 | Utility CSS |

---

## 3. Prerequisites

Install the following tools before setting up the project:

### Required
| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | ≥ 18.x LTS | https://nodejs.org |
| **npm** | ≥ 9.x (bundled with Node) | — |
| **MySQL** | ≥ 8.0 | https://dev.mysql.com/downloads/ |
| **Git** | any | https://git-scm.com |

### Optional (for Docker deployment)
| Tool | Version | Download |
|------|---------|----------|
| **Docker** | ≥ 24.x | https://docs.docker.com/get-docker/ |
| **Docker Compose** | ≥ 2.x | Bundled with Docker Desktop |

### Verify installations
```bash
node  --version   # v18.x.x or higher
npm   --version   # 9.x.x or higher
mysql --version   # 8.x.x
git   --version
```

---

## 4. Project Structure

```
ITAM_Project/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app setup, all route registrations
│   │   ├── server.js               # Entry point — DB sync, startup migrations, server listen
│   │   ├── config/
│   │   │   └── db.js               # Sequelize connection (reads DB_* env vars)
│   │   ├── controllers/            # Business logic (one file per resource)
│   │   │   ├── authController.js
│   │   │   ├── googleAuthController.js
│   │   │   ├── assetController.js
│   │   │   ├── employeeController.js
│   │   │   ├── userController.js
│   │   │   ├── softwareController.js
│   │   │   ├── systemPreferenceController.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT verification, attaches req.user
│   │   │   ├── entityAccess.js     # Sets req.tenantDb from X-Entity-Code header
│   │   │   ├── moduleAccess.js     # Checks user's module permissions
│   │   │   └── roleGuard.js        # Role-based access (admin check)
│   │   ├── models/                 # Sequelize models (21 models)
│   │   │   ├── User.js
│   │   │   ├── Asset.js
│   │   │   ├── Employee.js
│   │   │   ├── Entity.js
│   │   │   ├── Role.js
│   │   │   ├── SystemPreference.js
│   │   │   ├── SoftwareLicense.js
│   │   │   ├── SoftwareAssignment.js
│   │   │   └── ...
│   │   ├── routes/                 # Express routers (22 route files)
│   │   │   ├── authRoutes.js
│   │   │   ├── assetRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── reportScheduler.js  # node-cron job for automated reports
│   │   ├── templates/              # Email HTML templates
│   │   └── utils/
│   │       ├── generateToken.js    # JWT sign helper
│   │       ├── TenantManager.js    # Multi-tenant DB connection pool
│   │       ├── domainCheck.js      # Email domain restriction helper
│   │       ├── ensureAssetColumns.js
│   │       └── ensureAssetStatusEnum.js
│   ├── .env                        # ← create from .env.example
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # All React routes defined here
│   │   ├── main.jsx                # Root render, context providers wrapping
│   │   ├── components/
│   │   │   ├── charts/             # AssetStatusPie, LicenseUsagePie
│   │   │   ├── sidebar/            # Sidebar.jsx (navigation)
│   │   │   ├── topbar/             # TopBar.jsx (header, theme toggle)
│   │   │   └── ui/                 # Shared UI: Button, Modal, Table, etc.
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Login state, token storage
│   │   │   ├── ThemeContext.jsx    # Dark/light theme, persisted in localStorage
│   │   │   ├── EntityContext.jsx   # Selected entity, entity list
│   │   │   └── ToastContext.jsx    # Global toast notifications
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Assets.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── Software.jsx
│   │   │   ├── OrgSettings.jsx
│   │   │   ├── AssetAllocation.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── AIIntelligence.jsx
│   │   │   └── settings/
│   │   │       ├── SystemPreferences.jsx
│   │   │       ├── PasswordPolicy.jsx
│   │   │       ├── UsersRoles.jsx
│   │   │       ├── SecurityAudit.jsx
│   │   │       ├── Notifications.jsx
│   │   │       ├── ReportSchedule.jsx
│   │   │       └── ...
│   │   ├── services/
│   │   │   └── api.js              # All API calls (100+ methods)
│   │   └── styles/                 # Global CSS variables, theme tokens
│   ├── .env                        # ← create from .env.example
│   ├── .env.example
│   ├── package.json
│   ├── index.html
│   └── Dockerfile
│
└── devops/
    ├── docker-compose.yml
    └── nginx/                      # Nginx reverse-proxy config
```

---

## 5. Database Setup

### Create database and user

```sql
-- Log in as MySQL root
mysql -u root -p

-- Create the database
CREATE DATABASE itamdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (use a strong password in production)
CREATE USER 'itamuser'@'localhost' IDENTIFIED BY 'itam@123';

-- Grant permissions
GRANT ALL PRIVILEGES ON itamdb.* TO 'itamuser'@'localhost';
-- Also grant CREATE so the app can create tenant databases at runtime
GRANT CREATE ON *.* TO 'itamuser'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

> **Note:** The application uses a **multi-tenant** architecture. When an entity (company/subsidiary) is created in the UI, the backend automatically creates a new database named `itamdb_<entityCode>`. The `itamuser` needs `CREATE` privileges on `*.*` for this to work.

### Schema management

Tables are created **automatically on first startup** via `sequelize.sync()`. Additional columns added in later releases are applied via `ensureXxx()` helper functions that run every startup (safe to re-run — they check before altering).

No manual migration files or `sequelize-cli` commands are needed.

---

## 6. Backend Setup

```bash
# 1. Navigate to backend
cd ITAM_Project/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your values (see Section 8)

# 4. Start in development mode (auto-reloads on file changes)
npm run dev

# 5. OR start in production mode
npm start
```

The server starts on **http://localhost:5000** (configurable via `PORT` env var).

On first startup the server will:
1. Connect to MySQL (retries up to 10 times, 5 s apart)
2. Run `sequelize.sync()` to create all tables
3. Run `ensureXxx()` column-migration helpers
4. Create a default admin user if none exists

---

## 7. Frontend Setup

```bash
# 1. Navigate to frontend
cd ITAM_Project/frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your values (see Section 8)

# 4. Start dev server
npm run dev
# Opens at http://localhost:5173

# 5. Build for production
npm run build
# Output: frontend/dist/
```

---

## 8. Environment Variables Reference

### `backend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `127.0.0.1` | MySQL host |
| `DB_NAME` | Yes | `itamdb` | Main database name |
| `DB_USER` | Yes | `itamuser` | MySQL username |
| `DB_PASSWORD` | Yes | `itam@123` | MySQL password |
| `JWT_SECRET` | Yes | `SUPERSECRETJWTKEY` | Secret for signing JWTs — **use a long random string in production** |
| `PORT` | No | `5000` | Port the Express server listens on |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth Client ID (enables "Sign in with Google") |

```env
# backend/.env
DB_HOST=127.0.0.1
DB_NAME=itamdb
DB_USER=itamuser
DB_PASSWORD=your_strong_password

JWT_SECRET=change_this_to_a_long_random_secret_string

PORT=5000

# Optional — only needed if Google Sign-In is enabled
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

### `frontend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | No | — | Same Google OAuth Client ID as backend — enables the "Sign in with Google" button |

```env
# frontend/.env
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

---

## 9. Google OAuth Setup

Google Sign-In is **optional**. If neither env var is set, the Google button is simply absent.

To enable it:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project (or select existing)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add to **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs**: not needed (token-based flow — no redirect)
7. Copy the Client ID
8. Set `GOOGLE_CLIENT_ID=<client-id>` in `backend/.env`
9. Set `VITE_GOOGLE_CLIENT_ID=<client-id>` in `frontend/.env`

> Users must already have an account in ITAM (same email). Google Sign-In does not auto-register new users — an admin must create the account first.

---

## 10. Running the Application

### Development (two terminals)

**Terminal 1 — Backend**
```bash
cd ITAM_Project/backend
npm run dev
# Backend running on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd ITAM_Project/frontend
npm run dev
# Frontend running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Production (built frontend served via Nginx)

```bash
# Build frontend
cd ITAM_Project/frontend
npm run build          # Output: frontend/dist/

# Start backend
cd ITAM_Project/backend
NODE_ENV=production npm start

# Serve frontend/dist via Nginx (see devops/nginx/ for config)
```

### Docker Compose

```bash
cd ITAM_Project/devops
docker-compose up --build

# Frontend:  http://localhost:80
# Backend:   http://localhost:5000
# MySQL:     localhost:3306
```

---

## 11. API Reference

All API routes (except `/api/entities/:code/logo-image` and `/api/auth/*`) require:

```
Authorization: Bearer <JWT token>
```

Entity-scoped routes also require:

```
X-Entity-Code: <entityCode>
```

### Base URL
```
http://localhost:5000/api
```

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | None | Email + password login |
| `POST` | `/auth/google` | None | Google OAuth token login |

**Login request body:**
```json
{ "email": "user@company.com", "password": "Password@123" }
```

**Login response:**
```json
{
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": 1, "name": "Admin", "email": "...", "role": "admin",
    "phone": "", "title": "",
    "allowedEntities": ["OFB"],
    "entityPermissions": { "OFB": { "assets": true, "employees": true } }
  }
}
```

**Google login request body:**
```json
{ "credential": "<Google ID token from frontend>" }
```

---

### Assets — `/api/assets` *(requires X-Entity-Code)*

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/` | any | Get all assets for entity |
| `POST` | `/` | any | Create asset |
| `PUT` | `/:id` | any | Update asset |
| `DELETE` | `/:id` | any | Delete asset |
| `GET` | `/export` | any | Export assets as Excel |
| `POST` | `/import` | any | Import assets from Excel (multipart/form-data) |
| `POST` | `/transfer` | any | Transfer asset to another entity |
| `GET` | `/transfers` | any | List transfer history |

---

### Employees — `/api/employees` *(requires X-Entity-Code)*

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/` | any | Get all employees |
| `POST` | `/` | any | Create employee |
| `PUT` | `/:id` | any | Update employee |
| `DELETE` | `/:id` | any | Delete employee |
| `GET` | `/export` | any | Export employees as Excel |
| `POST` | `/import` | any | Import employees from Excel |

---

### Software — `/api/software` *(requires X-Entity-Code)*

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/` | any | Get software inventory (licenses + assignments) |
| `POST` | `/licenses` | any | Create software license |
| `PUT` | `/licenses/:id` | any | Update software license |
| `DELETE` | `/licenses/:id` | any | Delete license (also removes all assignments) |
| `POST` | `/assignments` | any | Assign software to user |
| `PUT` | `/assignments/:id` | any | Update assignment |
| `DELETE` | `/assignments/:id` | any | Remove assignment (decrements seatsUsed) |

---

### Users — `/api/users` *(admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Get all users |
| `POST` | `/` | Create user |
| `PUT` | `/profile` | Update own profile |
| `PUT` | `/:id` | Update any user (admin) |

---

### Roles — `/api/roles` *(admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Get all roles |
| `POST` | `/` | Create role |
| `PUT` | `/:id` | Update role |
| `DELETE` | `/:id` | Delete role |

---

### Entities — `/api/entities`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/:code/logo-image` | None (public) | Serve entity logo image |
| `GET` | `/` | JWT | Get all entities |
| `POST` | `/` | admin | Create entity (auto-creates tenant DB) |
| `PUT` | `/:id` | admin | Update entity |
| `DELETE` | `/:id` | admin | Delete entity |

---

### System Preferences — `/api/system-preferences`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | JWT | Get all preferences |
| `POST` | `/` | admin | Update preferences |

Managed fields include: backup settings, password policy (min/max length, complexity, expiry, lockout), domain restrictions, and financial settings.

---

### Departments / Locations / Asset Categories

All follow the same pattern with `X-Entity-Code`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/departments` | List departments |
| `POST` | `/api/departments` | Create |
| `PUT` | `/api/departments/:id` | Update |
| `DELETE` | `/api/departments/:id` | Delete |

Same for `/api/locations` and `/api/asset-categories`.

---

### Report Schedules — `/api/report-schedules` *(admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List schedules |
| `POST` | `/` | Create schedule |
| `PUT` | `/:id` | Update schedule |
| `DELETE` | `/:id` | Delete schedule |
| `POST` | `/:id/run` | Run immediately |

---

### AI Intelligence — `/api/ai` *(requires X-Entity-Code)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/insights` | Dashboard insights |
| `GET` | `/health` | Asset health scores |
| `POST` | `/search` | Smart keyword search |
| `GET` | `/anomalies` | Anomaly detection |
| `GET` | `/forecast` | Budget forecast |
| `POST` | `/categorize` | Auto-categorize asset names |
| `GET` | `/suggest-allocation/:employeeId` | Allocation suggestions |

---

### Audit Logs — `/api/params/audit` *(admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Get audit log entries |
| `POST` | `/` | Create audit log entry |

---

### Backups — `/api/backups` *(admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/run` | Trigger backup now |
| `GET` | `/` | List backup files |
| `GET` | `/:filename` | Download backup file |
| `DELETE` | `/:filename` | Delete backup file |

---

## 12. Database Schema

### Main database: `itamdb`

| Table | Description |
|-------|-------------|
| `Users` | Application users (admins, managers, employees) |
| `Roles` | Custom roles with granular permissions |
| `Entities` | Companies / subsidiaries |
| `SystemPreferences` | Global app settings (singleton row) |
| `EmailSettings` | SMTP configuration (singleton row) |
| `NotificationSettings` | Notification toggles (singleton row) |
| `AuditLogs` | Immutable audit trail |
| `ReportSchedules` | Automated report jobs |
| `AlertRules` | Alert/notification rules |
| `Organization` | Top-level organization info (singleton row) |
| `AssetTransfers` | Cross-entity asset transfer records |
| `AssetIdPrefixes` | Custom asset ID prefix rules per entity+category |
| `AnalyticsEvents` | User activity analytics |

### Tenant databases: `itamdb_<entityCode>`

Each entity gets its own database created at runtime:

| Table | Description |
|-------|-------------|
| `Assets` | Hardware/IT assets |
| `Employees` | Employees linked to assets |
| `Departments` | Organizational departments |
| `Locations` | Physical locations/offices |
| `AssetCategories` | Asset type categories |
| `Licenses` | License agreements |
| `SoftwareLicenses` | Software products with seat counts |
| `SoftwareAssignments` | Individual software-to-user assignments |

---

### Key columns — `Users` table

```sql
id                  INT PK AUTO_INCREMENT
name                VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
password            VARCHAR(255) NOT NULL          -- bcrypt hash, 12 rounds
role                VARCHAR(255) DEFAULT 'employee'
status              VARCHAR(255) DEFAULT 'Active'
phone               VARCHAR(255) NULL
title               VARCHAR(255) NULL
allowedEntities     TEXT NULL                      -- JSON array: ["OFB","SUB1"]
entityPermissions   TEXT NULL                      -- JSON map of module access
failedLoginAttempts INT DEFAULT 0                  -- PCI-DSS lockout counter
lockedUntil         DATETIME NULL                  -- Lockout expiry
lastPasswordChange  DATETIME NULL
```

### Key columns — `SystemPreferences` table

```sql
-- Password Policy (NIST SP 800-63B / ISO 27001 A.9.4 / PCI-DSS 8.3)
passwordMinLength           INT DEFAULT 12
passwordMaxLength           INT DEFAULT 128
passwordRequireUpper        TINYINT(1) DEFAULT 1
passwordRequireLower        TINYINT(1) DEFAULT 1
passwordRequireNumber       TINYINT(1) DEFAULT 1
passwordRequireSpecial      TINYINT(1) DEFAULT 1
passwordExpiryDays          INT DEFAULT 90
passwordReuseLimit          INT DEFAULT 12
passwordLockoutAttempts     INT DEFAULT 5
passwordLockoutDurationMins INT DEFAULT 15
allowedLoginDomains         TEXT NULL  -- comma-separated: "company.com,sub.org"

-- Backup
autoBackupEnabled    TINYINT(1) DEFAULT 0
backupFrequency      VARCHAR(255) DEFAULT 'daily'
backupTime           VARCHAR(255) DEFAULT '02:00'
backupRetentionDays  INT DEFAULT 30
backupType           VARCHAR(255) DEFAULT 'both'
backupLocation       VARCHAR(255) DEFAULT './backups'

-- Financial
fiscalYearStart      VARCHAR(255) DEFAULT 'April'
depreciationMethod   VARCHAR(255) DEFAULT 'Straight Line'
defaultUsefulLife    INT DEFAULT 36
salvageValuePercent  INT DEFAULT 5
capexThreshold       INT DEFAULT 50000
```

---

## 13. Authentication & Authorization

### JWT Flow

```
1. User POSTs email+password to POST /api/auth/login
2. Backend verifies password with bcrypt
3. On success → signs JWT: { id, role, iat, exp }
4. Frontend stores token in localStorage ("token")
5. Every subsequent request includes: Authorization: Bearer <token>
6. authMiddleware.js verifies token and attaches req.user
```

Token expiry: **7 days** (configurable in `generateToken.js`).

### Google OAuth Flow

```
1. User clicks "Sign in with Google" button (frontend)
2. @react-oauth/google returns a Google ID token (JWT)
3. Frontend POSTs { credential } to POST /api/auth/google
4. Backend verifies token with google-auth-library OAuth2Client
5. Checks email domain restriction (if configured)
6. Looks up user by email (must pre-exist — no auto-registration)
7. Returns same ITAM JWT as regular login
```

### Role-Based Access Control

Roles are stored per-user and can be: `admin`, `manager`, `employee`, or any custom role.

| Resource | Access Level |
|----------|-------------|
| `/api/users` | `admin` only (roleGuard) |
| `/api/roles` | `admin` only |
| `/api/system-preferences` POST | `admin` only |
| `/api/backups` | `admin` only |
| `/api/report-schedules` | `admin` only |
| `/api/params/audit` | `admin` only |
| `/api/assets`, `/api/employees` | `admin` + `entityAccess` + `moduleAccess("assets"|"employees")` |
| `/api/auth/*` | Public (no token required) |
| `/api/entities/:code/logo-image` | Public |

### Account Lockout (PCI-DSS 8.3.4)

After N failed login attempts (default: 5), the account is locked for M minutes (default: 15). The counter is stored in `Users.failedLoginAttempts` and `Users.lockedUntil`. Every lockout event is written to `AuditLogs`.

### Domain Restriction

If `SystemPreferences.allowedLoginDomains` is set (e.g. `"company.com,sub.org"`), only users with matching email domains can log in — applies to both email/password and Google OAuth. Empty = no restriction.

---

## 14. Frontend Routes

```
/login                          Public — login page

/dashboard                      All authenticated users
/profile                        All authenticated users (edit name, phone, title)
/profile/password               All authenticated users (change password)
/ai-intelligence                All authenticated users

/assets                         Requires "assets" module access
/assets/add                     Requires "assets" module access
/assets/edit/:id                Requires "assets" module access
/assets/allocate                Requires "assets" module access
/assets/handover                Requires "assets" module access

/employees                      Requires "employees" module access

/software                       Requires "assets" module access

/org-settings                   Requires "assets" module access
                                (departments, locations, asset categories — tabbed)

/settings/entities              Admin only — manage companies/subsidiaries
/settings/users                 Admin only — users & roles
/settings/asset-config          Admin only — asset ID prefixes, warranty alerts
/settings/licenses              Admin only — license compliance
/settings/assignments           Admin only — assignment ownership rules
/settings/notifications         Admin only — email & alert settings
/settings/security              Admin only — audit log viewer
/settings/reports               Admin only — report scheduling
/settings/system                Admin only — system preferences, backups, theme
/settings/password              Admin only — password policy, domain restrictions

*                               Redirects to /dashboard
```

---

## 15. Key Features

### Asset Management
- Full CRUD with status tracking: `In Use`, `Available`, `Under Repair`, `Retired`, `Theft/Missing`
- Excel import/export (`.xlsx`)
- Custom asset ID generation with entity+category prefixes
- Cross-entity asset transfer workflow with audit trail
- Asset allocation and handover forms

### Software License Management
- Track software products, seat counts, and renewal dates
- Assign software to employees (seat counting enforced)
- Delete license cascades to all assignments

### Employee Management
- Full CRUD with department and entity association
- Bulk import/export via Excel

### Multi-Entity Support
- Each entity is isolated in its own tenant database
- Users are granted access to specific entities with per-module permissions
- Entity logos served publicly (no auth required for favicon/report use)

### Scheduled Reports
- Configurable reports: asset inventory, license usage, software assignments
- Frequencies: daily, weekly, monthly, quarterly
- Multiple email recipients per schedule
- Reports generated as PDF and emailed via configured SMTP

### AI Intelligence
- Dashboard insights and recommendations
- Asset health scoring
- Budget forecasting
- Anomaly detection
- Smart natural-language search
- Auto-categorization of asset names
- Allocation suggestions per employee

### Password Policy (Compliance)
- NIST SP 800-63B: min 12, max 128, no forced complexity
- ISO 27001 A.9.4 / PCI-DSS 8.3: 90-day expiry, 12 reuse limit
- Account lockout after 5 failed attempts (15-minute lock)
- All policy values are configurable by admins in real-time
- Live compliance summary dashboard

### Domain Restriction
- Restrict logins to specific email domains (e.g. `company.com`)
- Enforced on both email/password and Google OAuth logins
- Configured via the Password Policy settings page
- Violations are logged to the audit trail

---

## 16. Docker / DevOps

A Docker Compose configuration is available in `devops/`:

```bash
cd devops
docker-compose up --build
```

This starts:
- `mysql` — MySQL 8 database
- `backend` — Node.js Express API
- `frontend` — Nginx serving the built React app

Nginx acts as a reverse proxy: all `/api/*` requests are forwarded to the backend; everything else serves the frontend SPA.

For custom Nginx configuration, see `devops/nginx/`.

---

## 17. Default Credentials

On first startup, if no admin user exists, the server creates:

| Field | Value |
|-------|-------|
| Email | `manish@ofbusiness.in` |
| Password | `Admin@123@` |
| Role | `admin` |

> **Change this immediately after first login.** Go to Profile → Change Password.

---

## Quick Start Summary

```bash
# 1. Clone / extract project
git clone <repo-url>
cd ITAM_Project

# 2. Database
mysql -u root -p -e "
  CREATE DATABASE itamdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'itamuser'@'localhost' IDENTIFIED BY 'itam@123';
  GRANT ALL PRIVILEGES ON itamdb.* TO 'itamuser'@'localhost';
  GRANT CREATE ON *.* TO 'itamuser'@'localhost';
  FLUSH PRIVILEGES;
"

# 3. Backend
cd backend
npm install
cp .env.example .env       # edit .env with your DB credentials and JWT secret
npm run dev                # starts on port 5000

# 4. Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env       # optional: add VITE_GOOGLE_CLIENT_ID
npm run dev                # starts on port 5173

# 5. Open http://localhost:5173
# Login: manish@ofbusiness.in / Admin@123@
```
