# Self-Critique & Future Improvements

As a Principal Engineer, I believe a system is never truly "finished," but merely stabilized for its current scale. While LeadDesk Mini is robust and production-ready for a small team, it has limitations that would need to be addressed as the business grows.

If I had another 24 hours of development time, I would focus on implementing **Role-Based Access Control (RBAC) and Audit Logging**.

---

## 1. Role-Based Access Control (RBAC)

### Current Limitation
The application currently uses a binary authentication state: users are either `anon` (public) or `authenticated` (admin). Any authenticated user has global access to view, update, or potentially delete (if allowed by RLS) every lead in the database. 

### Proposed Improvement
I would introduce specific roles within the Supabase JWT schema (e.g., `Super_Admin`, `Sales_Manager`, `Sales_Rep`). 
- A `Sales_Rep` should only be able to view and update leads that have been explicitly assigned to them via an `assigned_to` foreign key on the `leads` table.
- A `Sales_Manager` might have regional access.
- A `Super_Admin` would retain global access.

This would be enforced strictly at the database level by modifying the Row Level Security (RLS) policies. For example:
```sql
CREATE POLICY "Sales reps can view assigned leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING ( auth.jwt() ->> 'role' = 'Sales_Rep' AND assigned_to = auth.uid() );
```

### Expected Benefit
**Security and Compliance.** As the sales team grows, enforcing the principle of least privilege ensures that an account compromise only limits exposure to a subset of data. It prevents internal data hoarding or accidental mass modifications by junior representatives.

---

## 2. Audit Logging

### Current Limitation
When a lead's status is changed (e.g., from `New` to `Contacted`), the `updated_at` column is refreshed. However, we have no historical record of *who* made that change, or *when* the lead transitioned between specific states.

### Proposed Improvement
I would create a `lead_audit_logs` table in PostgreSQL. Using a database trigger, any `UPDATE` on the `leads` table would automatically insert a record into the audit table capturing:
- `lead_id`
- `previous_status`
- `new_status`
- `changed_by` (extracting `auth.uid()` from the active session)
- `changed_at`

### Expected Benefit
**Accountability and Analytics.** Managers would be able to see the exact timeline of a lead's lifecycle, identifying bottlenecks in the sales process (e.g., how long leads sit in the `Contacted` state before being `Closed`). It also provides accountability, showing exactly which team member handled the record.
