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

-- Team Management Functions

CREATE OR REPLACE FUNCTION public.get_all_admins()
RETURNS TABLE (user_id UUID, email TEXT) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.make_user_admin_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  caller_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT public.is_admin() INTO caller_is_admin;
  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add other admins.';
  END IF;

  -- Find the user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. They must sign in at least once first.';
  END IF;

  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'Admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'Admin';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

