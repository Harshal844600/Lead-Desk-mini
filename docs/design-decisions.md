# Architectural Design Decisions

Building a robust lead-capture platform for small teams requires thoughtful architectural choices. Here are three major engineering decisions made for LeadDesk Mini.

## 1. Using TanStack Start over Next.js

### Decision
We chose TanStack Start + Vite instead of Next.js for our SSR/Full-stack framework.

### Reason
TanStack Start natively integrates with TanStack Router, providing 100% type-safe routing out of the box. Vite offers significantly faster cold starts and Hot Module Replacement (HMR) during development compared to Webpack/Turbopack, which drastically improves developer experience (DX). Furthermore, it avoids the complexities of Next.js App Router's bleeding-edge RSC paradigms when a simple server-function pattern (`createServerFn`) is sufficient and much more predictable for this scale.

### Trade-off
Next.js has a massive ecosystem and Vercel's first-class support. By choosing TanStack Start, we trade away the maturity and community plugins available for Next.js, accepting the risks of an ecosystem that is still emerging but offers fundamentally better type safety and DX.

---

## 2. Supabase PostgreSQL with Direct RLS

### Decision
Instead of deploying a custom Node.js/Express backend with Prisma, we interface directly with Supabase via its SSR client and rely on Row Level Security (RLS) in PostgreSQL.

### Reason
Supabase provides instant backend capabilities, secure authentication, and a scalable Postgres database. By utilizing RLS, the database itself acts as the security boundary. If an attacker bypasses the frontend or the API layer, the database still refuses unauthorized queries (e.g., denying `anon` access to `SELECT` leads). It eliminates the need for maintaining an ORM, database migrations in Node, and building custom JWT validation middleware.

### Trade-off
Business logic is somewhat split between the database (RLS policies, triggers) and the server functions. Writing SQL for complex business logic can be harder to test in isolation and version control than using an ORM like Prisma in a dedicated backend layer.

---

## 3. End-to-End Type Safety with Zod

### Decision
We use Zod for defining our data schemas (e.g., `createLeadSchema`), which is shared across both the client-side (React Hook Form) and the server-side (`createServerFn` or API endpoint).

### Reason
Sharing the same schema guarantees that the validation rules enforced in the browser strictly match the rules enforced on the server. If we update a requirement (e.g., minimum name length becomes 3 instead of 2), updating the Zod schema automatically enforces it everywhere. It prevents malicious users from bypassing client-side validation using cURL or Postman.

### Trade-off
Zod adds a slight overhead to the bundle size. Additionally, relying solely on TypeScript and Zod for API definitions means we do not get out-of-the-box Swagger/OpenAPI documentation (unless we integrate additional libraries like `@asteasolutions/zod-to-openapi`), which might be required if the API needs to be consumed by external third parties.
