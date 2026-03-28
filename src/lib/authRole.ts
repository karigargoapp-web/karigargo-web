import { supabase } from './supabase'
import type { UserRole } from '../types'

/**
 * After email/password sign-in, ensure `public.users.role` matches the login page
 * (customer vs worker). Signs out and returns an error message if it does not.
 */
export async function assertPortalRole(
  portal: 'customer' | 'worker',
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    await supabase.auth.signOut({ scope: 'local' })
    return { ok: false, message: 'Could not verify your session. Try again.' }
  }

  const { data, error } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()

  if (error || !data) {
    await supabase.auth.signOut({ scope: 'local' })
    return { ok: false, message: 'No profile found for this account. Contact support or sign up again.' }
  }

  const role = data.role as UserRole
  if (role === portal) return { ok: true }

  await supabase.auth.signOut({ scope: 'local' })

  if (portal === 'customer') {
    if (role === 'worker') {
      return {
        ok: false,
        message: 'This email is registered as a worker. Use the worker login page.',
      }
    }
    if (role === 'admin') {
      return {
        ok: false,
        message: 'This account is an admin. Open the admin app to sign in.',
      }
    }
  }

  if (portal === 'worker') {
    if (role === 'customer') {
      return {
        ok: false,
        message: 'This email is registered as a customer. Use the customer login page.',
      }
    }
    if (role === 'admin') {
      return {
        ok: false,
        message: 'This account is an admin. Open the admin app to sign in.',
      }
    }
  }

  return { ok: false, message: 'This account cannot sign in on this page.' }
}
