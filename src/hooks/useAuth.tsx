import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { signOutIfEmailPasswordUnconfirmed } from '../lib/authRole'
import { supabase } from '../lib/supabase'
import type { User as AppUser, UserRole } from '../types'
import type { User as SupaUser, Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: AppUser | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (supaUser: SupaUser) => {
    try {
      const kicked = await signOutIfEmailPasswordUnconfirmed(supaUser)
      if (kicked) {
        setSession(null)
        setUser(null)
        return
      }

      const emailConfirmed = !!supaUser.email_confirmed_at
      const isGoogleUser =
        supaUser.app_metadata?.provider === 'google' ||
        supaUser.identities?.some(i => i.provider === 'google')

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', supaUser.id)
        .single()

      if (data) {
        if (!data.verified && (emailConfirmed || isGoogleUser)) {
          await supabase.from('users').update({ verified: true }).eq('id', supaUser.id)
          data.verified = true
        }
        setUser(data as AppUser)
        return
      }

      if (!isGoogleUser) return

      const name =
        supaUser.user_metadata?.full_name ||
        supaUser.user_metadata?.name ||
        supaUser.email?.split('@')[0] ||
        'User'
      const photo =
        supaUser.user_metadata?.avatar_url ||
        supaUser.user_metadata?.picture ||
        null
      const intendedRole = localStorage.getItem('oauth-intended-role')
      localStorage.removeItem('oauth-intended-role')
      const role: UserRole = intendedRole === 'worker' ? 'worker' : 'customer'

      const { error: rpcErr } = await supabase.rpc('handle_signup_user', {
        p_id: supaUser.id,
        p_name: name,
        p_email: supaUser.email || '',
        p_phone: null,
        p_role: role,
        p_city: null,
        p_profile_photo_url: photo,
        p_verified: true,
      })

      if (!rpcErr && role === 'worker') {
        await supabase.rpc('handle_signup_worker_profile', {
          p_user_id: supaUser.id,
          p_skills: [],
          p_bio: null,
          p_cnic: '',
          p_cnic_front_url: '',
          p_cnic_back_url: '',
          p_certificate_urls: null,
        })
      }

      const { data: newData } = await supabase
        .from('users')
        .select('*')
        .eq('id', supaUser.id)
        .single()
      if (newData) setUser(newData as AppUser)
    } catch {
      console.error('[KarigarGo] Failed to fetch/create user profile')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchUserProfile(session.user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    setSession(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (session?.user) await fetchUserProfile(session.user)
  }

  return (
    <AuthContext.Provider
      value={{ session, user, role: user?.role ?? null, loading, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
