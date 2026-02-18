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
  signUp: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
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
      console.error('Error fetching user role:', error)
      return null
    }
    return data.role as UserRole
  }, [])

  useEffect(() => {
    let completed = false

    // Timeout fallback - if session check hangs, proceed without session
    const timeout = setTimeout(() => {
      if (!completed) {
        console.warn('Session check timed out, proceeding without session')
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
          console.error('Error getting session:', error)
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        // Read role directly from JWT metadata — instant, no DB round-trip needed.
        // Call refreshRole() explicitly when the role may have changed (e.g. after counselor approval).
        const role: UserRole | null = session?.user
          ? ((session.user.user_metadata?.role as UserRole) ?? null)
          : null
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
          role,
        })
      })
      .catch((error) => {
        if (completed) return
        completed = true
        clearTimeout(timeout)
        console.error('Session check failed:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Read role directly from JWT metadata — instant, no DB round-trip needed.
      // Call refreshRole() explicitly when the role may have changed (e.g. after counselor approval).
      const role: UserRole | null = session?.user
        ? ((session.user.user_metadata?.role as UserRole) ?? null)
        : null
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
        role,
      })
    })

    return () => {
      completed = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    // Validate school email domain
    if (!isValidSchoolEmail(email)) {
      return {
        error: new Error('Please use your school email address to sign up.'),
      }
    }

    const schoolDomain = extractSchoolDomain(email)

    // Determine initial role based on domain type
    const domainType = classifyDomain(schoolDomain!)
    const initialRole = domainType === 'staff' ? UserRole.PENDING_COUNSELOR : UserRole.STUDENT

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          school_domain: schoolDomain,
          role: initialRole,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (!error) {
      // Create student record in the students table
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        // Insert into students table with appropriate role
        await supabase.from('students').insert({
          id: userData.user.id,
          email: email,
          school_domain: schoolDomain,
          role: initialRole,
          email_verified: false,
        })

        // If pending counselor, create approval request
        if (initialRole === UserRole.PENDING_COUNSELOR) {
          await supabase.from('counselor_approvals').insert({
            user_id: userData.user.id,
            status: 'pending',
          })
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

    if (!error && data.user) {
      // Update last_active in the background - don't block login on this
      supabase
        .from('students')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(() => {}) // fire-and-forget
    }

    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
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
