/**
 * Role-Based Route Component
 *
 * Protects routes based on user role.
 * Redirects users who don't have the required role.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { UserRole } from '../../../types/shared'
import { Loader2 } from 'lucide-react'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

export default function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo,
}: RoleBasedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (!role || !allowedRoles.includes(role)) {
    // Determine where to redirect based on actual role
    const redirect = redirectTo || getDefaultRedirect(role)
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}

/**
 * Get the default redirect path based on user role
 */
function getDefaultRedirect(role: UserRole | null): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin'
    case UserRole.STUDENT:
      return '/dashboard'
    case UserRole.COUNSELOR:
      return '/counselor'
    case UserRole.PENDING_COUNSELOR:
      return '/awaiting-approval'
    default:
      return '/login'
  }
}

/**
 * Hook to get the appropriate home route for the current user
 */
export function useHomeRoute(): string {
  const { role } = useAuth()
  return getDefaultRedirect(role)
}
