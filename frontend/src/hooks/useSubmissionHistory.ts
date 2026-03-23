/**
 * React Query hook for fetching student submission history
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { GetSubmissionHistoryResponse } from '../../../types/shared'

export function useSubmissionHistory(limit = 20, offset = 0) {
  const { session, user } = useAuth()

  return useQuery<GetSubmissionHistoryResponse>({
    queryKey: ['submissions', 'history', user?.id, limit, offset],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch(
        `/api/submissions/history?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch submission history')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch history')
      }

      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
