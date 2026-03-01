import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import { UserRole } from '../../types/shared'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CounselorDashboard from './pages/CounselorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AwaitingApproval from './pages/AwaitingApproval'
import RoleBasedRoute from './components/RoleBasedRoute'

/**
 * Smart Home Redirect Component
 * Redirects users to their appropriate dashboard based on role
 */
function HomeRedirect() {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on role
  switch (role) {
    case UserRole.ADMIN:
      return <Navigate to="/admin" replace />
    case UserRole.COUNSELOR:
      return <Navigate to="/counselor" replace />
    case UserRole.PENDING_COUNSELOR:
      return <Navigate to="/awaiting-approval" replace />
    case UserRole.STUDENT:
    default:
      return <Navigate to="/dashboard" replace />
  }
}

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Student Dashboard */}
      <Route
        path="/dashboard"
        element={
          <RoleBasedRoute allowedRoles={[UserRole.STUDENT]}>
            <Dashboard />
          </RoleBasedRoute>
        }
      />

      {/* Counselor Dashboard */}
      <Route
        path="/counselor"
        element={
          <RoleBasedRoute allowedRoles={[UserRole.COUNSELOR]}>
            <CounselorDashboard />
          </RoleBasedRoute>
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <RoleBasedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </RoleBasedRoute>
        }
      />

      {/* Awaiting Approval (Pending Counselors) */}
      <Route
        path="/awaiting-approval"
        element={
          <RoleBasedRoute allowedRoles={[UserRole.PENDING_COUNSELOR]}>
            <AwaitingApproval />
          </RoleBasedRoute>
        }
      />

      {/* Smart Home Redirect */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default App
