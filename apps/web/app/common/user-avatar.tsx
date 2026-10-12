'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/app/common/utils'

type UserAvatarProps = {
  name?: string | null
  avatarUrl?: string | null
  className?: string
  fallbackClassName?: string
  size?: 'sm' | 'default' | 'lg'
  cacheKey?: string | number | null
}

function avatarSrc(avatarUrl?: string | null, cacheKey?: string | number | null) {
  if (!avatarUrl) return undefined
  const base = avatarUrl.startsWith('http') ? avatarUrl : avatarUrl
  if (cacheKey == null || cacheKey === '') return base
  const joiner = base.includes('?') ? '&' : '?'
  return `${base}${joiner}v=${encodeURIComponent(String(cacheKey))}`
}

export function UserAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
  size = 'default',
  cacheKey,
}: UserAvatarProps) {
  const initial = (name?.trim() || 'U').charAt(0).toUpperCase()

  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={avatarSrc(avatarUrl, cacheKey)} alt={name ?? 'ผู้ใช้'} />
      <AvatarFallback
        className={cn(
          'bg-gradient-to-br from-primary/20 to-ha-green/15 font-bold text-primary',
          fallbackClassName
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
