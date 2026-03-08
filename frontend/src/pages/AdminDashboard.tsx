/**
 * Admin Dashboard - System overview and user management for admins
 */

import { useState } from 'react'
import {
  LogOut,
  User,
  Users,
  TrendingUp,
  AlertTriangle,
  Shield,
  Clock,
  Search,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useAdminUsers, useAdminStats, useUpdateUserRole } from '../hooks/useAdminData'
import { useAssignments } from '../hooks/useAssignments'
import { useAdminAlerts } from '../hooks/useAlerts'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { UserRole, AdminUserItem, AssignmentWithDetails, AlertWithDetails } from '../../../api/_types/shared'

type Tab = 'overview' | 'users' | 'assignments' | 'alerts'

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Student',
  [UserRole.PENDING_COUNSELOR]: 'Pending Counselor',
  [UserRole.COUNSELOR]: 'Counselor',
  [UserRole.ADMIN]: 'Admin',
}

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'bg-blue-100 text-blue-800',
  [UserRole.PENDING_COUNSELOR]: 'bg-yellow-100 text-yellow-800',
  [UserRole.COUNSELOR]: 'bg-green-100 text-green-800',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: usersData, isLoading: usersLoading } = useAdminUsers()
  const updateRoleMutation = useUpdateUserRole()
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    createMutation: createAssignment,
    deleteMutation: deleteAssignment,
  } = useAssignments()
  const { data: alertsData, isLoading: alertsLoading } = useAdminAlerts()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  // Filter users based on search and role
  const filteredUsers = usersData?.users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.school_domain.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display italic text-xl text-primary">MindSpace</h1>
            <span className="text-xs text-white bg-purple-600 rounded-full px-2 py-0.5">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === 'alerts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Alerts
              {alertsData && alertsData.pending_count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
                  {alertsData.pending_count}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} isLoading={statsLoading} />
          )}
          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alertsData?.alerts || []}
              isLoading={alertsLoading}
              pendingCount={alertsData?.pending_count || 0}
            />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab
              assignments={assignmentsData?.assignments || []}
              isLoading={assignmentsLoading}
              counselors={
                usersData?.users.filter((u) => u.role === UserRole.COUNSELOR) || []
              }
              students={
                usersData?.users.filter((u) => u.role === UserRole.STUDENT) || []
              }
              onAssign={(counselorId, studentIds) =>
                createAssignment.mutate({ counselorId, studentIds })
              }
              onRemove={(id) => deleteAssignment.mutate(id)}
              isCreating={createAssignment.isPending}
              isRemoving={deleteAssignment.isPending}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              users={filteredUsers}
              totalCount={usersData?.total_count || 0}
              isLoading={usersLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              onRoleChange={handleRoleChange}
              isUpdating={updateRoleMutation.isPending}
              currentUserId={user?.id || ''}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({
  stats,
  isLoading,
}: {
  stats: ReturnType<typeof useAdminStats>['data']
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-3xl font-bold text-primary">
                {isLoading ? '-' : stats?.total_students || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? '-' : stats?.total_counselors || 0}
              </p>
              <p className="text-sm text-muted-foreground">Active Counselors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-3xl font-bold text-purple-600">
                {isLoading ? '-' : stats?.total_submissions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-3xl font-bold text-red-600">
                {isLoading ? '-' : stats?.high_risk_submissions || 0}
              </p>
              <p className="text-sm text-muted-foreground">High Risk Submissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Submission volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Last 7 days</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {isLoading ? '-' : stats?.submissions_last_7_days || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Last 30 days</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {isLoading ? '-' : stats?.submissions_last_30_days || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">Students</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoading ? '-' : stats?.total_students || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Counselors</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoading ? '-' : stats?.total_counselors || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Pending Counselors</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoading ? '-' : stats?.total_pending_counselors || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Users Tab
// ============================================================================

function UsersTab({
  users,
  totalCount,
  isLoading,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onRoleChange,
  isUpdating,
  currentUserId,
}: {
  users: AdminUserItem[]
  totalCount: number
  isLoading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  roleFilter: UserRole | 'all'
  onRoleFilterChange: (r: UserRole | 'all') => void
  onRoleChange: (userId: string, role: UserRole) => void
  isUpdating: boolean
  currentUserId: string
}) {
  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by email or domain..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value as UserRole | 'all')}
              className="px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Roles</option>
              <option value={UserRole.STUDENT}>Students</option>
              <option value={UserRole.PENDING_COUNSELOR}>Pending Counselors</option>
              <option value={UserRole.COUNSELOR}>Counselors</option>
              <option value={UserRole.ADMIN}>Admins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {totalCount} total users {users.length !== totalCount && `(showing ${users.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Domain</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-3 px-2">
                        <span className="font-medium">{u.email}</span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{u.school_domain}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            ROLE_COLORS[u.role as UserRole] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ROLE_LABELS[u.role as UserRole] || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        {u.id === currentUserId ? (
                          <span className="text-xs text-muted-foreground italic">You</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => onRoleChange(u.id, e.target.value as UserRole)}
                            disabled={isUpdating}
                            className="text-xs px-2 py-1 border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                          >
                            <option value={UserRole.STUDENT}>Student</option>
                            <option value={UserRole.PENDING_COUNSELOR}>Pending Counselor</option>
                            <option value={UserRole.COUNSELOR}>Counselor</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Assignments Tab
// ============================================================================

function AssignmentsTab({
  assignments,
  isLoading,
  counselors,
  students,
  onAssign,
  onRemove,
  isCreating,
  isRemoving,
}: {
  assignments: AssignmentWithDetails[]
  isLoading: boolean
  counselors: AdminUserItem[]
  students: AdminUserItem[]
  onAssign: (counselorId: string, studentIds: string[]) => void
  onRemove: (id: string) => void
  isCreating: boolean
  isRemoving: boolean
}) {
  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  const handleAssign = () => {
    if (!selectedCounselor || selectedStudents.length === 0) return
    onAssign(selectedCounselor, selectedStudents)
    setSelectedStudents([])
  }

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const filteredStudents = students.filter(
    (s) =>
      !studentSearch ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  // Group assignments by counselor
  const groupedByCounselor = assignments.reduce(
    (acc, a) => {
      if (!acc[a.counselor_id]) {
        acc[a.counselor_id] = { email: a.counselor_email, assignments: [] }
      }
      acc[a.counselor_id].assignments.push(a)
      return acc
    },
    {} as Record<string, { email: string; assignments: AssignmentWithDetails[] }>
  )

  return (
    <div className="space-y-6">
      {/* Create Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Students to Counselor</CardTitle>
          <CardDescription>
            Select a counselor and choose students to assign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Counselor Select */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Counselor
              </label>
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a counselor...</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Search + Selection */}
            {selectedCounselor && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Students ({selectedStudents.length} selected)
                  </label>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredStudents.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded"
                        />
                        {s.email}
                      </label>
                    ))}
                    {filteredStudents.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No students found
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={selectedStudents.length === 0 || isCreating}
                  className="w-full sm:w-auto"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Assign {selectedStudents.length} Student
                  {selectedStudents.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>
            {assignments.length} active assignment{assignments.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedByCounselor).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No assignments yet. Assign students to counselors above.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByCounselor).map(([counselorId, group]) => (
                <div key={counselorId} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{group.email}</span>
                    <span className="text-xs text-muted-foreground">
                      ({group.assignments.length} student
                      {group.assignments.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.assignments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/50"
                      >
                        <span className="text-sm">{a.student_email}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.assigned_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-7 px-2"
                            onClick={() => onRemove(a.id)}
                            disabled={isRemoving}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Alerts Tab
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

function AlertsTab({
  alerts,
  isLoading,
  pendingCount,
}: {
  alerts: AlertWithDetails[]
  isLoading: boolean
  pendingCount: number
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {alerts.filter((a) => a.status === 'acknowledged').length}
            </p>
            <p className="text-sm text-muted-foreground">Acknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              {alerts.filter((a) => a.status === 'resolved').length}
            </p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned High-Risk Banner */}
      {alerts.some((a) => !a.counselor_id && a.status === 'pending') && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">
                  {alerts.filter((a) => !a.counselor_id && a.status === 'pending').length} unassigned
                  alert{alerts.filter((a) => !a.counselor_id && a.status === 'pending').length !== 1 ? 's' : ''} need
                  attention
                </p>
                <p className="text-sm text-red-700 mt-1">
                  These students have no assigned counselor. Go to the{' '}
                  <strong>Assignments</strong> tab to assign a counselor so they can follow up.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
          <CardDescription>System-wide at-risk alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No alerts have been triggered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Risk</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Counselor</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Triggered</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className={`border-b last:border-0 ${
                        !alert.counselor_id && alert.status === 'pending'
                          ? 'bg-red-50/80'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            alert.risk_level === 'high'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {alert.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[alert.status] || ''
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {alert.student_email}
                      </td>
                      <td className="py-3 px-2">
                        {alert.counselor_email ? (
                          <span className="text-muted-foreground">{alert.counselor_email}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                            <AlertTriangle className="h-3 w-3" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(alert.triggered_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
