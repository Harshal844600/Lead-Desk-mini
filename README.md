# LeadDesk Mini

A production-quality lead-capture mini-app: a polished public landing page with a
validated form, and an authenticated admin dashboard for triaging leads.

Built on the modern TanStack Start + Lovable Cloud (Supabase) stack.

## Features

- **Public landing page** with hero, features, and lead-capture form
- **Client + server validation** with a shared Zod schema
- **REST endpoint** `POST /api/public/leads` for programmatic submissions
- **Authenticated admin dashboard** at `/admin` (email/password sign in)
  - Search by name, email, or budget (partial matching)
  - Status filter and per-row status dropdown (New → Contacted → Closed)
  - Optimistic UI updates via React Query
  - Dashboard statistics + CSV export
- **RLS-protected data**: anonymous users can only INSERT leads; only signed-in
  users can list/update them
- **Toast notifications**, loading + empty + error states, accessible forms

## Tech stack

| Concern | Tech |
| --- | --- |
| Framework | TanStack Start v1 (React 19, Vite 7) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with semantic OKLCH design tokens |
| Data | Lovable Cloud (Supabase Postgres + Auth) |
| Server RPC | `createServerFn` + `requireSupabaseAuth` middleware |
| HTTP API | TanStack file routes under `src/routes/api/public/*` |
| Validation | Zod + React Hook Form |
| Data fetching | @tanstack/react-query |
| UI polish | sonner, lucide-react, date-fns |

## Architecture

```
Browser ──► Landing form ──► POST /api/public/leads ──► anon Supabase client
                                                        │
                                                    RLS INSERT
                                                        ▼
                                                   public.leads
                                                        ▲
                                             RLS SELECT/UPDATE
                                                        │
Browser ──► /admin (auth-gated) ──► listLeads / updateLeadStatus
                                     (createServerFn + requireSupabaseAuth)
```

- **Public write path** uses a publishable-key Supabase client on the server,
  behind Zod validation. Only INSERT is granted to `anon`.
- **Admin read/write** goes through authenticated server functions. The client
  bearer token is attached automatically by `attachSupabaseAuth` (registered in
  `src/start.ts`), and validated server-side by `requireSupabaseAuth`.

## Folder structure

```
src/
  routes/
    __root.tsx              # global shell, head metadata, Toaster
    index.tsx               # public landing page + capture form
    auth.tsx                # sign in / sign up
    admin.tsx               # admin dashboard (auth-gated in component)
    api/public/leads.ts     # POST /api/public/leads
  lib/
    lead-schemas.ts         # shared Zod schemas + types
    leads.functions.ts      # authenticated server functions
  integrations/supabase/    # generated Cloud client + auth middleware
  styles.css                # Tailwind v4 theme tokens
```

## Database schema

```sql
CREATE TYPE lead_status  AS ENUM ('New', 'Contacted', 'Closed');
CREATE TYPE budget_range AS ENUM ('<$1k','$1k-$5k','$5k-$25k','$25k-$100k','$100k+');

CREATE TABLE public.leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  budget     budget_range NOT NULL,
  message    TEXT NOT NULL,
  status     lead_status NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS policies:
- `anon, authenticated` can `INSERT`
- Only `authenticated` can `SELECT` and `UPDATE`

An `updated_at` trigger keeps the column fresh on every update.

## API reference

### `POST /api/public/leads` — public

Request:
```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "budget": "$5k-$25k",
  "message": "We'd like to discuss a pilot."
}
```

Responses:
- `201 Created` → `{ "ok": true, "id": "...", "created_at": "..." }`
- `400 Bad Request` → invalid JSON body
- `422 Unprocessable Entity` → `{ "error": "Validation failed", "issues": [...] }`
- `500 Internal Server Error` → database write failed

### `listLeads()` — authenticated server fn
Returns `Lead[]` ordered by newest first.

### `updateLeadStatus({ id, status })` — authenticated server fn
Updates a single lead's status; returns the updated row.

## First-time admin setup

1. Open `/auth`, choose **Create account**, register with an email + password.
2. Sign in and open `/admin`.

By default Lovable Cloud requires email confirmation. In the Cloud dashboard
(**Users → Authentication Settings**) you can disable that for development.

## Local development

```bash
bun install
bun run dev
```

The app runs at http://localhost:8080. Environment variables for Lovable Cloud
are auto-populated in `.env` when the integration is enabled.

## Deployment

This project deploys from Lovable — click **Publish** in the editor. Lovable
Cloud automatically provisions the database, runs migrations, and exposes both
the static assets and TanStack server routes/functions.

Backend changes deploy immediately; frontend changes go live when you click
Publish → Update.

## Security notes

- All user input is validated with Zod on both client and server.
- SQL injection is prevented by using the Supabase client (parameterised).
- RLS enforces that `anon` can only INSERT — never read or modify leads.
- Admin access is gated behind Supabase Auth; server functions verify the
  bearer JWT via `requireSupabaseAuth`.
- The service-role key is never bundled to the client.
- No secrets are checked into source; the generated `.env` is git-ignored.

## License

MIT
