'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/app/common/user-avatar'
import { cn } from '@/app/common/utils'

type ProfileAvatarEditorProps = {
  name: string
  avatarUrl?: string | null
  cacheKey?: string | number | null
  uploading?: boolean
  removing?: boolean
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
}

export function ProfileAvatarEditor({
  name,
  avatarUrl,
  cacheKey,
  uploading = false,
  removing = false,
  onUpload,
  onRemove,
}: ProfileAvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    try {
      await onUpload(file)
    } finally {
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(null)
    }
  }

  const displayUrl = previewUrl ?? avatarUrl ?? null
  const busy = uploading || removing

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <div className="relative">
        <UserAvatar
          name={name}
          avatarUrl={displayUrl}
          cacheKey={previewUrl ? null : cacheKey}
          size="lg"
          className="size-20 text-xl"
          fallbackClassName="text-2xl"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted',
            busy && 'cursor-not-allowed opacity-70'
          )}
          aria-label="เปลี่ยนรูปโปรไฟล์"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">รูปโปรไฟล์</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          อัปโหลด JPG, PNG, WebP หรือ GIF ขนาดไม่เกิน 2MB
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="size-4" />
            {uploading ? 'กำลังอัปโหลด...' : 'เลือกรูปใหม่'}
          </Button>
          {avatarUrl && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => void onRemove()}
            >
              <Trash2 className="size-4" />
              {removing ? 'กำลังลบ...' : 'ลบรูป'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
