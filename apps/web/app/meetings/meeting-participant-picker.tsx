'use client'

import { useMemo, useState } from 'react'
import { Building2, Briefcase, UserPlus, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useDepartmentOptions,
  useMeetingParticipantOptions,
} from '@/hooks/use-meeting-rooms'
import {
  groupParticipantsByDepartment,
  newParticipantKey,
  type MeetingParticipantDraft,
} from '@/app/meetings/meeting-participants'
import { showErrorToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

type Props = {
  value: MeetingParticipantDraft[]
  onChange: (list: MeetingParticipantDraft[]) => void
  enabled?: boolean
  compact?: boolean
}

export function MeetingParticipantPicker({ value, onChange, enabled = true, compact }: Props) {
  const [mode, setMode] = useState<'user' | 'guest'>('user')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [pickerUserId, setPickerUserId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestDept, setGuestDept] = useState('')
  const [guestPosition, setGuestPosition] = useState('')

  const { data: departments } = useDepartmentOptions(enabled)
  const { data: userOptions, isLoading: usersLoading } = useMeetingParticipantOptions(
    enabled,
    departmentFilter || undefined
  )

  const addedUserIds = useMemo(() => new Set(value.filter((p) => p.userId).map((p) => p.userId)), [value])

  const availableUsers = useMemo(
    () => (userOptions ?? []).filter((u) => !addedUserIds.has(u.id)),
    [userOptions, addedUserIds]
  )

  const grouped = useMemo(() => groupParticipantsByDepartment(value), [value])

  const addUser = () => {
    if (!pickerUserId) {
      showErrorToast('เลือกชื่อจากรายการ')
      return
    }
    const user = userOptions?.find((u) => u.id === pickerUserId)
    if (!user) return
    if (value.some((p) => p.userId === user.id)) {
      showErrorToast('มีรายชื่อนี้แล้ว')
      return
    }
    onChange([
      ...value,
      {
        key: newParticipantKey(),
        kind: 'user',
        userId: user.id,
        displayName: user.name,
        departmentName: user.departmentName ?? 'ไม่ระบุแผนก',
        positionTitle: user.positionTitle,
      },
    ])
    setPickerUserId('')
  }

  const addGuest = () => {
    if (!guestName.trim()) {
      showErrorToast('กรุณาระบุชื่อ')
      return
    }
    if (!guestDept.trim()) {
      showErrorToast('กรุณาระบุแผนก')
      return
    }
    onChange([
      ...value,
      {
        key: newParticipantKey(),
        kind: 'guest',
        displayName: guestName.trim(),
        departmentName: guestDept.trim(),
        positionTitle: guestPosition.trim() || null,
      },
    ])
    setGuestName('')
    setGuestDept('')
    setGuestPosition('')
  }

  const remove = (key: string) => onChange(value.filter((p) => p.key !== key))

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('user')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            mode === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          จากระบบ
        </button>
        <button
          type="button"
          onClick={() => setMode('guest')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            mode === 'guest' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          บุคคลภายนอก
        </button>
      </div>

      {mode === 'user' ? (
        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">กรองตามแผนก</Label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  setPickerUserId('')
                }}
                className="flex h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm"
              >
                <option value="">ทุกแผนก</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">เลือกบุคลากร</Label>
              <select
                value={pickerUserId}
                onChange={(e) => setPickerUserId(e.target.value)}
                disabled={usersLoading || availableUsers.length === 0}
                className="flex h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm"
              >
                <option value="">
                  {usersLoading
                    ? 'กำลังโหลด...'
                    : availableUsers.length === 0
                      ? 'ไม่มีรายชื่อ'
                      : 'เลือกชื่อ'}
                </option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.positionTitle ? ` · ${u.positionTitle}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addUser}>
            <UserPlus className="size-4" />
            เพิ่มชื่อ
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">ชื่อ-นามสกุล</Label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="ชื่อผู้เข้าร่วม"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">แผนก</Label>
              <Input
                value={guestDept}
                onChange={(e) => setGuestDept(e.target.value)}
                placeholder="เช่น งานการพยาบาล"
                list="guest-dept-list"
              />
              <datalist id="guest-dept-list">
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">ตำแหน่ง</Label>
              <Input
                value={guestPosition}
                onChange={(e) => setGuestPosition(e.target.value)}
                placeholder="เช่น หัวหน้างาน"
              />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addGuest}>
            <UserPlus className="size-4" />
            เพิ่มชื่อ
          </Button>
        </div>
      )}

      {value.length > 0 ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="size-3.5" />
            รายชื่อผู้เข้าร่วม ({value.length}) — แยกตามแผนก
          </p>
          {grouped.map(([dept, members]) => (
            <div key={dept} className="rounded-xl border border-border/70 bg-white p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Building2 className="size-4" />
                {dept}
                <span className="text-xs font-normal text-muted-foreground">({members.length})</span>
              </p>
              <ul className="space-y-2">
                {members.map((p) => (
                  <li
                    key={p.key}
                    className="flex items-start justify-between gap-2 rounded-lg bg-muted/25 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.displayName}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {p.positionTitle && (
                          <span className="inline-flex items-center gap-0.5">
                            <Briefcase className="size-3" />
                            {p.positionTitle}
                          </span>
                        )}
                        {p.kind === 'guest' && (
                          <Badge variant="outline" className="h-5 text-[10px]">
                            ภายนอก
                          </Badge>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(p.key)}
                      className="shrink-0 rounded-full p-1 hover:bg-muted"
                      aria-label="ลบ"
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">ยังไม่มีผู้เข้าร่วม — เพิ่มจากระบบหรือบุคคลภายนอก</p>
      )}
    </div>
  )
}
