<div align="center">
  <h1>🚀 LeadDesk Mini</h1>
  <p><strong>A crisp landing page and secure admin desk for capturing, qualifying, and closing inbound leads.</strong></p>
  
  ![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Vite](https://img.shields.io/badge/Vite-5.0-purple?style=for-the-badge&logo=vite)
  ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
</div>

<br/>

**🚀 Deployed Application**: [Link to Vercel/Netlify Deployment Here]  
**🎥 Loom Walkthrough**: [Link to Loom Video Here]  

### 🔑 Test Credentials
To evaluate the Admin Dashboard, please use the following credentials:
- **Email**: `harshalvidhate91@gmail.com`
- **Password**: `HRv@5805`

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Security](#-architecture--security)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [Testing](#-testing)

---

## 🌟 Overview

Built for small teams that ship, LeadDesk Mini provides an end-to-end type-safe solution from the client form straight to the database. It combines a visually stunning, conversion-optimized public landing page with a secure, highly functional back-office dashboard.

## ✨ Key Features

- **Public Landing Page**: A beautifully designed, typography-forward landing page with glassmorphism aesthetics, dynamic hover states, and smooth Framer Motion animations.
- **Lead Submission Form**: End-to-end type-safe form using Zod. Validates on the client for instant feedback, and strictly validates on the server to prevent bad data.
- **Admin Dashboard**: A secure back-office view for team members to read and manage leads. Built with optimistic UI updates via TanStack Query for a lightning-fast experience.
- **Search & Filter**: Find specific leads quickly using real-time filtering and status segmentation.
- **Status Management**: Update the lifecycle status of a lead (New, Contacted, Closed) with one click.
- **Team Management**: Invite coworkers and grant them Admin access directly from the UI using secure PostgreSQL `SECURITY DEFINER` functions.
- **Robust Security**: Supabase Row Level Security (RLS) protects all data from public exposure, ensuring only verified Admins can view or mutate records.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Framer Motion, Radix UI (shadcn/ui components).
- **Framework**: TanStack Start & TanStack Router for fast, SSR-capable routing and data-loading.
- **Backend**: Supabase (PostgreSQL) integrated natively via `@supabase/ssr`.
- **API Layer**: TanStack Server Functions for secure, zero-API-boilerplate backend logic.
- **Validation**: Zod (end-to-end type safety shared between client and server).
- **Testing**: Vitest for unit and integration testing of validation logic.
- **Deployment**: Vercel for the web application, Supabase for the database.

---

## 🔒 Architecture & Security

LeadDesk Mini takes security seriously. We use a multi-layered approach to ensure data integrity and access control:

1. **Row Level Security (RLS)**: The PostgreSQL database strictly enforces RLS policies. The `leads` table allows anonymous inserts, but completely blocks `SELECT`, `UPDATE`, and `DELETE` queries unless the user is authenticated and holds an `Admin` role in the `user_roles` table.
2. **Definer Functions**: Team Management is handled via secure `SECURITY DEFINER` RPC functions in Postgres. This allows the application to verify and assign roles without exposing the `auth.users` schema to the client.
3. **Server-Side Validation**: All incoming data (lead submissions, status updates, team invites) is parsed through Zod schemas on the server before interacting with the database.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Harshal844600/Lead-Desk-mini.git
cd Lead-Desk-mini
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run database migrations
Use the Supabase CLI to push the schema to your remote database or local instance:
```bash
supabase db push
```

### 5. Start the development server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🗄 Database Schema

The core of the application relies on the `leads` table in PostgreSQL.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary key, automatically generated. |
| `name` | `TEXT` | The submitter's full name. |
| `email` | `TEXT` | The submitter's email address. |
| `budget` | `ENUM` | Budget range (e.g., '<$1k', '$1k-$5k'). |
| `message` | `TEXT` | The inquiry details. |
| `status` | `ENUM` | Current lifecycle state: 'New', 'Contacted', or 'Closed'. |
| `created_at` | `TIMESTAMPTZ` | Timestamp of submission. |

### Team Management
- **`user_roles` Table**: Maps `auth.users` IDs to specific roles (e.g., `Admin`).
- **`is_admin()`**: Postgres function that safely verifies a user's role during RLS evaluation.

---

## 🧪 Testing

The project uses **Vitest** for isolated testing of shared validation and business logic.

- **Run tests once**: `npm run test` or `npx vitest run`
- **Run tests in watch mode**: `npx vitest`

**Coverage Goals**: We aim for 100% coverage on all Zod schema validation (happy paths, boundary conditions, and explicit failure cases like missing fields and invalid emails).
