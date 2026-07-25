import { createBrowserClient } from "@supabase/ssr";
import type { Database } from '@/integrations/supabase/types'

export const createClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
  );
};
