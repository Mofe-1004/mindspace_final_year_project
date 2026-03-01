/**
 * React Query hook for fetching the student's assigned counselor contact info
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'

interface CounselorInfo {
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
}

interface MyCounselorResponse {
  counselor: CounselorInfo | null
}

export function useMyCounselor() {
  const { session } = useAuth()

  return useQuery<MyCounselorResponse>({
    queryKey: ['my-counselor'],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session')

      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/counselor/my-counselor`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch counselor info')

      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Unknown error')

      return json.data as MyCounselorResponse
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
