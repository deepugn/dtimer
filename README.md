# DTimer SaaS - Multi-Stopwatch & Task Analytics Platform

An enterprise-ready **Multi-Stopwatch, Task Time-Tracking, and Productivity Analytics Platform** designed for knowledge workers, professionals, and students. Built with **Next.js (App Router), TypeScript, Prisma ORM, Tailwind CSS, Recharts, and Lucide Icons**.

---

## ✨ Features

### ⏱️ Multi-Stopwatch Command Center
- **Concurrent & Focus Modes:** Run multiple timers simultaneously or toggle **Focus Mode** (where starting one timer automatically pauses all others).
- **Wall-Clock Accuracy:** Calculates elapsed time using timestamp deltas (`Date.now() - startTime`), guaranteeing millisecond accuracy across tab sleep, app reloads, or network disconnects.
- **Global Batch Controls:** Instant "Start All", "Pause All", and "Reset All" buttons.
- **Laps & Splits:** Record laps with intermediate split times, lap differences, and optional notes.
- **One-Click History Logging:** Save accumulated stopwatch time into the immutable history ledger and reset for a fresh session.

### 🏷️ Flexible Categorization & Tagging
- Color-coded tags with custom emojis/icons (e.g., `💼 Office Work`, `📖 Reading a Book`, `⚡ Deep Work`, `👥 Meetings`, `🎓 Learning / Study`, `✉️ Admin & Email`).
- Multi-tagging per stopwatch and per task.
- Tag Manager modal to create, color-code, and delete categories on the fly.

### 📋 Task Completion Workflow
- Create tasks with estimated duration (minutes/hours), priority levels (High, Medium, Low), and due dates.
- Launch a linked stopwatch directly from any task card.
- Visual progress bar comparing **Tracked Time vs. Estimated Time**.
- **Complete Task Action:** Automatically halts the linked timer, logs the session, records actual time, and computes variance.

### 📜 Unlimited History Ledger
- **Relational SQL Storage:** Indexed time sessions (`userId`, `startTime`, `taskId`) allowing unlimited historical records without client performance degradation.
- Filter by date range (Start / End Date), tag, or keyword search.
- **Data Portability:** One-click **Export to CSV** (formatted for Excel, Google Sheets, billing) and **Export to JSON**.
- **Manual Time Entry:** Record offline work or book reading sessions retroactively.

### 📊 Deep Analytics & Dashboards
- **KPI Summary Cards:** Total time today, this week, this month, all-time, active streak counter (🔥), total sessions, and completed tasks.
- **Category Time Distribution:** Interactive Recharts Donut Chart showing percentage and hour allocation per tag.
- **Daily Focus Trends:** Bar charts showing minutes tracked per day.
- **Peak Productivity Hours:** 24-hour distribution showing which hours of the day you focus the most.
- **Estimated vs. Actual Variance:** Bar chart analyzing accuracy on completed tasks.

### 🔐 Multi-User Authentication & SaaS Architecture
- Multi-tenant data isolation: all entities strictly scoped to authenticated user IDs.
- Secure email & password authentication with `bcryptjs` password hashing and HTTP-only session cookies.
- One-click **Demo Login** for instant evaluation (`demo@dtimer.com` / `demo1234`).
- Ready for SaaS deployment on Vercel, Railway, Render, or Docker with PostgreSQL.

### 🛡️ SaaS Admin Console (`/admin`)
- Accessible to users with the `ADMIN` role.
- **Platform KPIs:** Total registered users, total platform hours tracked, real-time live ticking stopwatches across all users, and task completion rate.
- **User Directory & Activity Metrics:** Inspect every registered user, total hours logged, tasks created/completed, and stopwatches.
- **Subscription Tier & Role Management:** Promote users to `ADMIN` or change tiers (`FREE`, `PRO`, `ENTERPRISE`).
- **Live System Activity Feed:** Audit trail showing recent productivity blocks and timer sessions across all users.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (tested with Node.js v24)
- npm or pnpm

### 2. Environment Setup
The `.env` file is pre-configured with SQLite for instant local development:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
```
> **For Production SaaS (PostgreSQL):** Simply change `DATABASE_URL` in `.env`:
> ```env
> DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
> ```
> and update the provider in `prisma/schema.prisma` to `postgresql`.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

### 5. Demo Credentials
If you'd like to test with pre-populated tasks, stopwatches, and 7-day historical dashboards:
- **Email:** `demo@dtimer.com`
- **Password:** `demo1234`
*(Or click the "One-Click Demo" button directly on the login page)*

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Layer (Browser / PWA)"]
        UI["UI Components (React 18, Tailwind CSS, Lucide Icons)"]
        TimerEngine["Wall-Clock Delta Engine (requestAnimationFrame)"]
        AuthContext["Auth Context (JWT Cookie State)"]
        Charts["Analytics & Dashboards (Recharts)"]
    end

    subgraph NextServer["Next.js Full-Stack Application Server"]
        Router["App Router & Route Handlers"]
        
        subgraph APILayer["REST API Layer"]
            AuthAPI["/api/auth (Register, Login, Me, Logout)"]
            TimerAPI["/api/stopwatches (CRUD, Laps, Batch Controls)"]
            TaskAPI["/api/tasks (CRUD, Auto-Log on Complete)"]
            HistoryAPI["/api/sessions (Unlimited Ledger, CSV/JSON Export)"]
            AnalyticsAPI["/api/analytics (KPIs, Tag Donut, Heatmaps)"]
            AdminAPI["/api/admin (User Registry, Roles/Tiers, Activity Stream)"]
        end

        AuthGuard["Auth & RBAC Middleware (Bcrypt, JWT Verification)"]
        PrismaClient["Prisma ORM Client Singleton"]
    end

    subgraph DataLayer["Persistence Layer"]
        subgraph DevEnv["Local Development"]
            SQLite[("SQLite dev.db")]
        end
        subgraph ProdEnv["Production SaaS"]
            Postgres[("PostgreSQL (Neon / Supabase / AWS Lightsail)")]
            Indexes["Composite Indexes:
            - (userId, startTime)
            - (userId, taskId)
            - (userId, status)"]
        end
    end

    UI --> TimerEngine
    UI --> AuthContext
    UI --> Charts

    TimerEngine -->|"REST / JSON"| Router
    AuthContext -->|"HTTP-Only Cookie"| Router
    Charts -->|"Aggregated Queries"| Router

    Router --> AuthGuard
    AuthGuard --> APILayer
    APILayer --> PrismaClient

    PrismaClient -.-> DevEnv
    PrismaClient === ProdEnv
```

---

## 📁 Project Architecture

```
dtimer/
├── prisma/
│   ├── schema.prisma         # Data models: User, Tag, Task, Stopwatch, Lap, TimeSession
│   └── seed.js               # Database seeder with sample tasks, tags, and history
├── src/
│   ├── app/
│   │   ├── api/              # Full REST API
│   │   │   ├── admin/        # Admin stats, user management, activity stream
│   │   │   ├── auth/         # Login, Register, Logout, Me
│   │   │   ├── stopwatches/  # CRUD, Laps, Batch actions, Log session
│   │   │   ├── tasks/        # CRUD, Complete task workflow
│   │   │   ├── tags/         # CRUD categories
│   │   │   ├── sessions/     # Unlimited history query, manual entry, CSV/JSON export
│   │   │   └── analytics/    # Aggregated KPIs, tag donut, daily trends, heatmap, variance
│   │   ├── admin/            # SaaS Admin Console Page
│   │   ├── login/            # SaaS Login Page
│   │   ├── register/         # SaaS Registration Page
│   │   ├── layout.tsx        # Root Layout & Theme
│   │   └── page.tsx          # Main Application Dashboard
│   ├── components/
│   │   ├── Navbar.tsx        # Header with navigation tabs, timer count & user menu
│   │   ├── StopwatchCard.tsx # High-precision live ticker, controls, and laps drawer
│   │   ├── CreateStopwatchModal.tsx # Add/Edit stopwatch modal
│   │   ├── TaskBoard.tsx     # Task cards with progress bars and timer triggers
│   │   ├── UnlimitedHistoryView.tsx # History table, filters, and export buttons
│   │   ├── AnalyticsView.tsx # Visual dashboards powered by Recharts
│   │   └── TagManagerModal.tsx # Category tag management
│   ├── context/
│   │   └── AuthContext.tsx   # Client authentication state provider
│   └── lib/
│       ├── auth.ts           # JWT signing/verification, password hashing
│       ├── prisma.ts         # Prisma client singleton
│       └── time-utils.ts     # Wall-clock delta math & formatting
├── Dockerfile                # Production multi-stage Docker container
├── docker-compose.yml        # Full-stack Docker deployment with PostgreSQL
└── package.json
```
