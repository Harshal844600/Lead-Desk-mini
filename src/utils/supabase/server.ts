import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { Database } from '@/integrations/supabase/types'

export function createClient() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
  const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          const cookies = getCookies()
          return Object.keys(cookies).map(name => ({ name, value: cookies[name] }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              setCookie(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // Ignore error when setting cookies in read-only environment
          }
        },
      },
    }
  )
}
