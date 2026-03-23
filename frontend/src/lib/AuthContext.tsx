import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { isValidSchoolEmail, extractSchoolDomain, classifyDomain } from './utils'
import { UserRole } from '../../../types/shared'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  role: UserRole | null
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, roleChoice?: 'student' | 'counselor', phoneNumber?: string, firstName?: string, lastName?: string) => Promise<{ error: AuthError | Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    role: null,
  })

  // Fetch user role from students table
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('students')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }
    return data.role as UserRole
  }, [])

  useEffect(() => {
    let completed = false

    // Timeout fallback - if session check hangs, proceed without session
    const timeout = setTimeout(() => {
      if (!completed) {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }, 5000)

    // Get initial session and role
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (completed) return
        completed = true
        clearTimeout(timeout)

        if (error) {
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        // 1. Set state immediately with JWT role so the app is not blocked.
        const jwtRole: UserRole | null = session?.user
          ? ((session.user.user_metadata?.role as UserRole) ?? null)
          : null
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
          role: jwtRole,
        })

        // 2. Verify role and sync name from DB in the background.
        if (session?.user) {
          try {
            const apiBase = import.meta.env.VITE_API_URL || ''
            const profileRes = await fetch(`${apiBase}/api/auth/ensure-profile`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            })
            const profileData = await profileRes.json()
            if (profileData.success && profileData.data) {
              const updates: Partial<AuthState> = {}
              const dbRole = profileData.data.role as UserRole
              if (dbRole && dbRole !== jwtRole) {
                updates.role = dbRole
              }
              const dbFirstName = profileData.data.first_name as string | null
              const dbLastName = profileData.data.last_name as string | null
              if (dbFirstName || dbLastName) {
                updates.user = {
                  ...session.user,
                  user_metadata: {
                    ...session.user.user_metadata,
                    first_name: dbFirstName ?? session.user.user_metadata?.first_name,
                    last_name: dbLastName ?? session.user.user_metadata?.last_name,
                  },
                }
              }
              if (Object.keys(updates).length > 0) {
                setState(prev => ({ ...prev, ...updates }))
              }
            }
          } catch {
            // Fallback: try fetching role directly
            try {
              const dbRole = await fetchUserRole(session.user.id)
              if (dbRole && dbRole !== jwtRole) {
                setState(prev => ({ ...prev, role: dbRole }))
              }
            } catch {
              // DB unreachable — JWT role stays as fallback
            }
          }
        }
      })
      .catch(() => {
        if (completed) return
        completed = true
        clearTimeout(timeout)
        setState(prev => ({ ...prev, isLoading: false }))
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 1. Set auth state immediately using JWT role — never blocks login or page load.
      const jwtRole: UserRole | null = session?.user
        ? ((session.user.user_metadata?.role as UserRole) ?? null)
        : null
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
        role: jwtRole,
      })

      // 2. On fresh sign-in, ensure profile exists and verify role.
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Ensure student record exists server-side (bypasses RLS)
          const apiBase = import.meta.env.VITE_API_URL || ''
          const profileRes = await fetch(`${apiBase}/api/auth/ensure-profile`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
          const profileData = await profileRes.json()
          if (profileData.success && profileData.data) {
            const updates: Partial<AuthState> = {}
            // Sync role from DB
            const dbRole = profileData.data.role as UserRole
            if (dbRole && dbRole !== jwtRole) {
              updates.role = dbRole
            }
            // Sync first_name/last_name from DB into local user metadata
            // so the Dashboard greeting works for accounts created before these fields existed
            const dbFirstName = profileData.data.first_name as string | null
            const dbLastName = profileData.data.last_name as string | null
            if (dbFirstName || dbLastName) {
              updates.user = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  first_name: dbFirstName ?? session.user.user_metadata?.first_name,
                  last_name: dbLastName ?? session.user.user_metadata?.last_name,
                },
              }
            }
            if (Object.keys(updates).length > 0) {
              setState(prev => ({ ...prev, ...updates }))
            }
          }
        } catch {
          // Fallback: try fetching role directly
          try {
            const dbRole = await fetchUserRole(session.user.id)
            if (dbRole && dbRole !== jwtRole) {
              setState(prev => ({ ...prev, role: dbRole }))
            }
          } catch {
            // DB unreachable — JWT role stays as fallback
          }
        }
      }
    })

    return () => {
      completed = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, roleChoice?: 'student' | 'counselor', phoneNumber?: string, firstName?: string, lastName?: string) => {
    // Validate school email domain
    if (!isValidSchoolEmail(email)) {
      return {
        error: new Error('Please use your school email address to sign up.'),
      }
    }

    const schoolDomain = extractSchoolDomain(email)

    // Determine initial role:
    // - If user chose "counselor", set as pending_counselor (needs admin approval)
    // - If user chose "student" (or no choice), use domain classification as fallback
    let initialRole: UserRole
    if (roleChoice === 'counselor') {
      initialRole = UserRole.PENDING_COUNSELOR
    } else {
      const domainType = classifyDomain(schoolDomain!)
      initialRole = domainType === 'staff' ? UserRole.PENDING_COUNSELOR : UserRole.STUDENT
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          school_domain: schoolDomain,
          role: initialRole,
          phone_number: phoneNumber || null,
          first_name: firstName || null,
          last_name: lastName || null,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (!error && signUpData.user) {
      // Create student record in the students table.
      // Use the user returned by signUp() directly — getUser() won't work
      // before email confirmation.
      const { error: insertError } = await supabase.from('students').insert({
        id: signUpData.user.id,
        email: email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phoneNumber || null,
        school_domain: schoolDomain,
        role: initialRole,
        email_verified: false,
      })

      if (insertError) {
        // Non-critical during signup — ensure-profile will create on first login
      }

      // If pending counselor, create approval request
      if (initialRole === UserRole.PENDING_COUNSELOR) {
        const { error: approvalError } = await supabase.from('counselor_approvals').insert({
          user_id: signUpData.user.id,
          status: 'pending',
        })
        if (approvalError) {
          // Non-critical — will be created by ensure-profile on login
        }
      }
    }

    return { error }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.session) {
      // Call server-side endpoint to ensure student record exists.
      // This uses the service role key to bypass RLS, solving the issue
      // where the signup insert fails because RLS blocks unauthenticated inserts.
      try {
        const apiBase = import.meta.env.VITE_API_URL || ''
        await fetch(`${apiBase}/api/auth/ensure-profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch {
        // Non-critical — profile will be ensured on next auth state change
      }
    }

    return { error }
  }, [])

  const signOut = useCallback(async () => {
    // 1. Clear React Query cache to prevent showing old user's data to new user
    try {
      // Dynamic import to avoid circular dependency
      const { queryClient } = await import('../main')
      queryClient.clear() // Clears all cached queries
    } catch {
      // If import fails, continue with logout
    }

    // 2. Immediately clear React auth state so the UI reacts instantly.
    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      role: null,
    })

    // 3. Tell Supabase to clear its localStorage session.
    //    Use local scope to avoid a network call that can hang.
    //    Wrapped in try/catch so sign-out never fails from the user's perspective.
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // If Supabase signOut fails, manually remove the session from storage.
      const storageKey = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
      localStorage.removeItem(storageKey)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }, [])

  // Refresh role (useful after approval)
  const refreshRole = useCallback(async () => {
    if (state.user) {
      const newRole = await fetchUserRole(state.user.id)
      setState((prev) => ({ ...prev, role: newRole }))
    }
  }, [state.user, fetchUserRole])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
