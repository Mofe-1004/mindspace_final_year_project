/**
 * React Query hook for fetching aggregate trends (counselors only)
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { GetAggregateTrendsResponse } from '../../../types/shared'

export function useAggregateTrends(startDate?: string, endDate?: string) {
  const { session } = useAuth()

  return useQuery<GetAggregateTrendsResponse>({
    queryKey: ['trends', 'aggregate', startDate, endDate],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const response = await fetch(`/api/trends/aggregate?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch aggregate trends')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch trends')
      }

      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
