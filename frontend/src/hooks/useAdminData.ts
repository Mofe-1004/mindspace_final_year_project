/**
 * React Query hooks for admin dashboard data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import {
  GetAdminUsersResponse,
  AdminStatsResponse,
  UpdateUserRoleResponse,
  UserRole,
} from '../../../types/shared'

export function useAdminUsers() {
  const { session, user } = useAuth()

  return useQuery<GetAdminUsersResponse>({
    queryKey: ['admin', 'users', user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch users')
      }

      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 1,
  })
}

export function useAdminStats() {
  const { session, user } = useAuth()

  return useQuery<AdminStatsResponse>({
    queryKey: ['admin', 'stats', user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch stats')
      }

      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 30,
  })
}

export function useUpdateUserRole() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<
    UpdateUserRoleResponse,
    Error,
    { userId: string; role: UserRole }
  >({
    mutationFn: async ({ userId, role }) => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId, role }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to update role')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update role')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
