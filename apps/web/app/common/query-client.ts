import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { showErrorToast } from '@/app/common/toast-store'

let lastErrorToast = { message: '', at: 0 }

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
}

function showQueryErrorToast(message: string) {
  const now = Date.now()
  if (message === lastErrorToast.message && now - lastErrorToast.at < 4000) return
  lastErrorToast = { message, at: now }
  showErrorToast(message)
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const rootKey = query.queryKey[0]
        // presence/notifications โพลบ่อย — ไม่รบกวนด้วย toast
        if (rootKey === 'presence' || rootKey === 'notifications') return
        showQueryErrorToast(getErrorMessage(error))
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        showQueryErrorToast(getErrorMessage(error))
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          const msg = getErrorMessage(error)
          if (msg.includes('เข้าสู่ระบบ') || msg.includes('Token')) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }
  return browserQueryClient
}
