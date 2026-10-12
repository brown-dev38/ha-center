'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  MapPin,
  Pencil,
  Eye,
  Plus,
  Power,
  Users,
  Wrench,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMeetingRoomsAdmin } from '@/hooks/use-meeting-rooms'
import {
  createMeetingRoom,
  toggleMeetingRoomActive,
  updateMeetingRoom,
  type MeetingRoomAdmin,
  type UpsertMeetingRoomInput,
} from '@/app/meetings/meeting-rooms-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

const roomSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อห้อง'),
  code: z.string().min(1, 'กรุณาระบุรหัสห้อง'),
  capacity: z.union([z.coerce.number().min(1), z.literal('')]).optional(),
  location: z.string().optional(),
  equipment: z.string().optional(),
})

type RoomForm = z.infer<typeof roomSchema>

function RoomFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: MeetingRoomAdmin
}) {
  const queryClient = useQueryClient()
  const isEdit = !!initial

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomForm>({
    resolver: formResolver(roomSchema),
    values: initial
      ? {
          name: initial.name,
          code: initial.code,
          capacity: initial.capacity ?? '',
          location: initial.location ?? '',
          equipment: initial.equipment ?? '',
        }
      : undefined,
    defaultValues: { name: '', code: '', capacity: '', location: '', equipment: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: RoomForm) => {
      const payload: UpsertMeetingRoomInput = {
        name: values.name,
        code: values.code,
        location: values.location || undefined,
        equipment: values.equipment || undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
      }
      if (isEdit && initial) return updateMeetingRoom(initial.id, payload)
      return createMeetingRoom(payload)
    },
    onSuccess: () => {
      showSuccessToast(isEdit ? 'บันทึกห้องประชุมแล้ว' : 'เพิ่มห้องประชุมแล้ว')
      queryClient.invalidateQueries({ queryKey: ['meeting-rooms'] })
      onOpenChange(false)
      reset()
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    },
  })

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุม'}</DialogTitle>
          <DialogDescription>กำหนดชื่อ รหัส ความจุ และสถานที่</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">ชื่อห้อง</Label>
            <Input id="room-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room-code">รหัสห้อง</Label>
              <Input id="room-code" {...register('code')} placeholder="MR-01" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-cap">ความจุ (คน)</Label>
              <Input id="room-cap" type="number" min={1} {...register('capacity')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-loc">ที่ตั้ง</Label>
            <Input id="room-loc" {...register('location')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-eq">อุปกรณ์ / หมายเหตุ</Label>
            <textarea
              id="room-eq"
              rows={3}
              {...register('equipment')}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MeetingRoomManager() {
  const { data: rooms, isLoading, isError, error } = useMeetingRoomsAdmin()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<MeetingRoomAdmin | null>(null)

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleMeetingRoomActive(id, isActive),
    onSuccess: (_, vars) => {
      showSuccessToast(vars.isActive ? 'เปิดใช้งานห้องแล้ว' : 'ปิดใช้งานห้องแล้ว')
      queryClient.invalidateQueries({ queryKey: ['meeting-rooms'] })
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    },
  })

  const activeCount = (rooms ?? []).filter((r) => r.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-ha-green text-primary-foreground shadow-md">
            <Building2 className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">จัดการห้องประชุม</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} ห้องพร้อมใช้งาน · ทั้งหมด {rooms?.length ?? 0} ห้อง — เพิ่ม/แก้ไข/เปิดปิดห้องได้ที่นี่
            </p>
          </div>
        </div>
        <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          เพิ่มห้อง
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังโหลดห้องประชุม...
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : 'โหลดไม่สำเร็จ'}
        </p>
      )}

      {!isLoading && rooms && rooms.length > 0 && (
        <div className={cn(surfaceCardClass(), "overflow-hidden")}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-4">ห้อง</TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ความจุ</TableHead>
                <TableHead>ที่ตั้ง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="pr-4 text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow
                  key={room.id}
                  className={cn(!room.isActive && 'bg-muted/20 opacity-75')}
                >
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/dashboard/meetings/rooms/${room.id}`}
                      className="text-primary hover:underline"
                    >
                      {room.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {room.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {room.capacity ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="size-3.5 text-muted-foreground" />
                        {room.capacity}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                    {room.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        {room.location}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={room.isActive ? 'default' : 'secondary'}
                      className={cn(
                        room.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      )}
                    >
                      {room.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Badge>
                    {(room.meetingsCount ?? 0) > 0 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {room.meetingsCount} นัดที่กำลังจะมาถึง
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard/meetings/rooms/${room.id}`}
                        title="ดูรายละเอียดการประชุมในห้อง"
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'inline-flex'
                        )}
                      >
                        <Eye className="size-4 text-primary" />
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditRoom(room)}
                        title="แก้ไข"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({ id: room.id, isActive: !room.isActive })
                        }
                        title={room.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      >
                        <Power
                          className={cn(
                            'size-4',
                            room.isActive ? 'text-rose-600' : 'text-emerald-600'
                          )}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && rooms?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Wrench className="mb-3 size-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">ยังไม่มีห้องประชุม</p>
          <Button type="button" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            เพิ่มห้องแรก
          </Button>
        </div>
      )}

      <RoomFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editRoom && (
        <RoomFormDialog
          open={!!editRoom}
          onOpenChange={(o) => !o && setEditRoom(null)}
          initial={editRoom}
        />
      )}
    </div>
  )
}
