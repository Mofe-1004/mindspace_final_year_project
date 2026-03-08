/**
 * React Query hook for counselor's assigned students aggregate trends
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { MyStudentsTrendsResponse } from '../../../api/_types/shared'

export function useMyStudentsTrends(days: number = 7) {
  const { session } = useAuth()

  return useQuery<MyStudentsTrendsResponse>({
    queryKey: ['counselor', 'my-students', days],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session')

      const response = await fetch(`/api/counselor/my-students?days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch student trends')
      const result = await response.json()
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch')
      return result.data
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 2,
  })
}
