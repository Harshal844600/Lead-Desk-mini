# Loom Walkthrough Script

**Duration**: ~5 to 8 minutes

---

## 1. Introduction (0:00 - 1:00)

**[Camera On, Screen showing the Landing Page]**

"Hi, I'm [Your Name], a Principal Software Engineer. Today, I'll be walking you through my implementation of LeadDesk Mini, a high-performance lead capture system and admin dashboard."

"The goal of this project was to build a full-stack application that doesn't just work, but demonstrates true engineering maturity—focusing on strict type safety, end-to-end validation, secure data fetching, and an exceptional user experience."

---

## 2. Landing Page & Validation (1:00 - 2:30)

**[Action: Scroll through the landing page, hover over elements to show animations]**

"Here is the public-facing landing page. I focused on a premium aesthetic utilizing glassmorphism and Framer Motion for fluid, performant micro-interactions."

**[Action: Scroll down to the Lead Form. Leave fields empty and click 'Send Message']**

"Let's look at the lead form. If I try to submit an empty form, you'll see immediate, client-side validation errors. We are using Zod schemas hooked into React Hook Form."

**[Action: Fill out the form with a valid name, email, budget, and a detailed message. Click 'Send Message'. Show the success state.]**

"When I submit valid data, the payload is securely passed to our backend. The UX is seamless—using `AnimatePresence` to transition into a success state without jarring page loads."

---

## 3. Admin Dashboard (2:30 - 4:00)

**[Action: Click the 'Admin' link in the header. Log in if necessary, showing the Admin Dashboard.]**

"Now we're in the Admin Dashboard. This area is strictly protected. Unauthenticated users cannot access this route, and more importantly, they cannot query this data due to Supabase Row Level Security."

**[Action: Type 'Ada' into the search bar. Show the table filtering in real-time.]**

"All leads are displayed in a clean data table. I can easily search through them. The search logic here leverages TanStack Query or Server Functions to securely filter records on the backend, ensuring we don't over-fetch data to the client."

**[Action: Click the status dropdown on a lead and change it from 'New' to 'Contacted'.]**

"We can also update the lifecycle status. Changing this to 'Contacted' fires an optimistic update in the UI while securely persisting the change to our PostgreSQL database via a `PATCH` server function."

---

## 4. Code Walkthrough: End-to-End Type Safety (4:00 - 6:00)

**[Action: Open VS Code. Show `src/lib/lead-schemas.ts` and then `tests/lead-validation.test.ts`]**

"I want to highlight a specific architectural decision: our validation layer. In `src/lib/lead-schemas.ts`, we define our `createLeadSchema` using Zod. This single source of truth is imported by the client-side form, but it is *also* imported by our backend API."

"This prevents code duplication and ensures that if a malicious user bypasses the browser, the server enforces the exact same rules. Furthermore, this logic is fully unit-tested. As you can see in `tests/lead-validation.test.ts`, we use Vitest to strictly verify that missing fields, invalid emails, and edge-cases are properly caught by the schema."

---

## 5. Self-Critique (6:00 - 7:00)

**[Action: Switch back to camera only or keep the code editor open]**

"While I'm proud of this implementation, a principal engineer always looks for areas of improvement. If I had another day of development, I would implement **Role-Based Access Control (RBAC)**."

"Currently, any authenticated user can view and edit all leads. As the team scales, we would need roles like `Sales_Rep` and `Admin`. I would implement this using Supabase custom JWT claims, allowing us to enforce at the database level that a sales rep can only see leads assigned specifically to them, while admins have global access. This would make the platform secure for enterprise-scale teams."

---

## 6. Conclusion (7:00 - 8:00)

"To wrap up, LeadDesk Mini demonstrates a clean, maintainable architecture. By utilizing TanStack Start, Zod, and Supabase, we achieved exceptional developer velocity without sacrificing scalability, security, or user experience."

"Thank you for your time, and I look forward to discussing the code with you."
