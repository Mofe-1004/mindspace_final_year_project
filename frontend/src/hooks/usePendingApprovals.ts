/**
 * React Query hook for managing pending counselor approvals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { GetPendingApprovalsResponse, ApproveCounselorResponse } from '../../../api/_types/shared'

export function usePendingApprovals() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery<GetPendingApprovalsResponse>({
    queryKey: ['counselors', 'pending'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('/api/counselors', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch approvals')
      }

      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  const approveMutation = useMutation<
    ApproveCounselorResponse,
    Error,
    { userId: string; approve: boolean; rejectionReason?: string }
  >({
    mutationFn: async ({ userId, approve, rejectionReason }) => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('/api/counselors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          approve,
          rejection_reason: rejectionReason,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process approval')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to process approval')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate pending approvals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['counselors', 'pending'] })
    },
  })

  return {
    ...query,
    approveMutation,
  }
}
