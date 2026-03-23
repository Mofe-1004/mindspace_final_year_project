/**
 * React Query hooks for at-risk alerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { GetAlertsResponse } from '../../../types/shared'

/** Hook for counselors to view/manage their alerts */
export function useCounselorAlerts() {
  const { session, user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery<GetAlertsResponse>({
    queryKey: ['counselor', 'alerts', user?.id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch('/api/counselor/alerts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch alerts')
      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed')
      return result.data
    },
    enabled: !!session?.access_token,
    refetchInterval: 30000, // Poll every 30 seconds for near-real-time
    staleTime: 1000 * 15,
  })

  const acknowledgeMutation = useMutation<void, Error, string>({
    mutationFn: async (alertId) => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch(
        `/api/counselor/alerts?id=${alertId}&action=acknowledge`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )

      if (!response.ok) throw new Error('Failed to acknowledge alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselor', 'alerts'] })
    },
  })

  const resolveMutation = useMutation<void, Error, { alertId: string; notes?: string }>({
    mutationFn: async ({ alertId, notes }) => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch(
        `/api/counselor/alerts?id=${alertId}&action=resolve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ resolution_notes: notes }),
        }
      )

      if (!response.ok) throw new Error('Failed to resolve alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselor', 'alerts'] })
    },
  })

  return { ...query, acknowledgeMutation, resolveMutation }
}

/** Hook for admins to view all system alerts */
export function useAdminAlerts() {
  const { session, user } = useAuth()

  return useQuery<GetAlertsResponse>({
    queryKey: ['admin', 'alerts', user?.id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch('/api/admin/alerts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch alerts')
      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed')
      return result.data
    },
    enabled: !!session?.access_token,
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 1000 * 30,
  })
}
