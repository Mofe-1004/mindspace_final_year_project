/**
 * React Query hook for managing counselor-student assignments (admin)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import {
  GetAssignmentsResponse,
  CreateAssignmentResponse,
} from '../../../types/shared'

export function useAssignments() {
  const { session, user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery<GetAssignmentsResponse>({
    queryKey: ['admin', 'assignments', user?.id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch('/api/admin/assignments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch assignments')
      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch')
      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60,
  })

  const createMutation = useMutation<
    CreateAssignmentResponse,
    Error,
    { counselorId: string; studentIds: string[] }
  >({
    mutationFn: async ({ counselorId, studentIds }) => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ counselor_id: counselorId, student_ids: studentIds }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error?.message || 'Failed to create assignment')
      }
      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed')
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] })
    },
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (assignmentId) => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch(`/api/admin/assignments?id=${assignmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to remove assignment')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] })
    },
  })

  return { ...query, createMutation, deleteMutation }
}
