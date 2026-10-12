import { resolveAppApiUrl } from '@/app/common/api-path'

export type UploadProgress = {
  loaded: number
  total: number
  /** 0-100 */
  percent: number
}

export type UploadOptions = {
  url: string
  method?: 'POST' | 'PUT'
  body: FormData
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}

export type UploadResult<T = unknown> = {
  data?: T
  message?: string
}

/**
 * Upload via XHR — รองรับ progress callback
 * fetch ใน browser ไม่ stream upload progress ต้องใช้ XMLHttpRequest
 */
export function uploadWithProgress<T = unknown>({
  url,
  method = 'POST',
  body,
  onProgress,
  signal,
}: UploadOptions): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, resolveAppApiUrl(url))
    xhr.withCredentials = true

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        const total = e.lengthComputable ? e.total : 0
        const percent = total > 0 ? Math.round((e.loaded / total) * 100) : 0
        onProgress({ loaded: e.loaded, total, percent })
      }
    }

    xhr.onload = () => {
      const text = xhr.responseText
      let json: { success?: boolean; error?: string; message?: string; data?: T } | null = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        /* not json */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.success !== false) {
        resolve({ data: json?.data, message: json?.message })
        return
      }
      const raw = json?.error ?? json?.message ?? `อัปโหลดไม่สำเร็จ (HTTP ${xhr.status})`
      reject(new Error(raw))
    }

    xhr.onerror = () => {
      reject(new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'))
    }

    xhr.onabort = () => {
      reject(new Error('ยกเลิกการอัปโหลด'))
    }

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
      } else {
        signal.addEventListener('abort', () => xhr.abort(), { once: true })
      }
    }

    xhr.send(body)
  })
}
