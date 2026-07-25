CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Sales_Rep'))
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin());

-- Drop old loose policies
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

-- More restrictive policies
CREATE POLICY "Admins and assigned reps can view leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_admin() OR assigned_to = auth.uid());

CREATE POLICY "Admins and assigned reps can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.is_admin() OR assigned_to = auth.uid()) 
WITH CHECK (public.is_admin() OR assigned_to = auth.uid());
