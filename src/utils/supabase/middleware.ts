import { createMiddleware } from '@tanstack/react-start'
import { createClient } from './server'

/**
 * In TanStack Start, we don't need to manually pass the request and response 
 * around like in Next.js middleware. Our `src/utils/supabase/server.ts` already 
 * handles setting the updated cookies on the response automatically via `setCookie`.
 * 
 * We can just use `createMiddleware` to fetch the user (which refreshes the session
 * if it's expired) and inject it into the context of our server functions.
 */
export const supabaseMiddleware = createMiddleware().server(async ({ next }) => {
  const supabase = createClient()
  
  // Calling getUser() will automatically refresh the auth token if it's expired.
  // Our server client's `setAll` method will automatically attach the new cookies
  // to the outgoing response.
  const { data: { user } } = await supabase.auth.getUser()

  return next({
    context: {
      supabase,
      user
    }
  })
})
