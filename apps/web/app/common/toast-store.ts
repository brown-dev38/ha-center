import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info'

export function showErrorToast(message: string) {
  toast.error(message)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}

export function showInfoToast(message: string) {
  toast.info(message)
}
