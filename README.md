# LeadDesk Mini

**🚀 Deployed Application**: [Link to Vercel/Netlify Deployment Here]  
**🎥 Loom Walkthrough**: [Link to Loom Video Here]  

### Test Credentials
To evaluate the Admin Dashboard, please use the following credentials:
- **Email**: `your_email@example.com` (Replace with your actual admin email)
- **Password**: `your_password_here` (Replace with your actual password)

---

A crisp landing page and admin desk for capturing, qualifying, and closing inbound leads. Built for small teams that ship, LeadDesk Mini provides an end-to-end type-safe solution from the client form straight to the database.

## Features

- **Public Landing Page**: A beautifully designed, typography-forward landing page with glassmorphism aesthetics and Framer Motion animations.
- **Lead Submission Form**: Client-side and server-side validated form to capture inbound leads.
- **Admin Dashboard**: A secure back-office view for team members to read and manage leads.
- **Search & Filter**: Find specific leads quickly.
- **Status Management**: Update the lifecycle status of a lead (New, Contacted, Closed) with one click.
- **Robust Security**: Supabase Row Level Security (RLS) protects admin data from public exposure.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Framer Motion, Radix UI (shadcn/ui components).
- **Framework**: TanStack Start & TanStack Router for fast, SSR-capable routing and data-loading.
- **Backend**: Supabase (PostgreSQL) integrated natively via `@supabase/ssr` and TanStack Server Functions.
- **Validation**: Zod (end-to-end type safety shared between client and server).
- **Testing**: Vitest for unit and integration testing of validation logic.
- **Deployment**: Vercel/Netlify for the web application, Supabase for the database.

## Folder Structure

```text
leaddesk-mini/
├── src/
│   ├── components/ui/       # Reusable shadcn/ui components
│   ├── lib/                 # Shared utilities and Zod schemas
│   ├── routes/              # TanStack Router file-based routing
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Public landing page
│   │   └── admin/           # Admin dashboard routes
│   └── utils/supabase/      # Supabase SSR client utilities
├── supabase/
│   └── migrations/          # PostgreSQL schema and RLS policies
├── tests/                   # Vitest validation test suites
└── docs/                    # Architectural and API documentation
```

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/leaddesk-mini.git
cd leaddesk-mini
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

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | The REST URL for your Supabase project. Required by the client and server to interact with the database. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The public anon key for Supabase. Safe to expose to the browser. Used for public lead submission. |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret admin key for Supabase. **Never expose this to the browser**. Used securely on the server for admin tasks. |

## Database Schema

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
| `updated_at` | `TIMESTAMPTZ` | Timestamp of the last status update, managed via DB triggers. |

### Security (RLS)
- **Insert**: Allowed for `anon` (public visitors) and `authenticated` users.
- **Select / Update**: Restricted strictly to `authenticated` administrative users.

## Testing

The project uses **Vitest** for isolated testing of shared validation and business logic.

- **Run tests once**: `npm run test` or `npx vitest run`
- **Run tests in watch mode**: `npx vitest`

**Coverage Goals**: We aim for 100% coverage on all Zod schema validation (happy paths, boundary conditions, and explicit failure cases like missing fields and invalid emails).

## Deployment

### Frontend Deployment
The application is built on Vite and TanStack Start, making it highly compatible with Vercel, Netlify, or Cloudflare Pages.
- **Build Command**: `npm run build`
- **Output Directory**: `dist` (or `.output` depending on your Nitro preset).
Ensure that the `VITE_SUPABASE_*` environment variables are securely injected into your deployment platform.

### Database Deployment
The database should be deployed using Supabase. The schema is tracked in `supabase/migrations/` and can be deployed via CI/CD using GitHub Actions and the Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

---
*For a deeper dive into the API design and engineering trade-offs, please see the `docs/` folder.*
