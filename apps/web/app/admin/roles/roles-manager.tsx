'use client'

import { ShieldCheck } from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminRolesList } from '@/hooks/use-admin'
import { getPermissionsForRole, ROLE_LABELS } from '@/app/common/permissions'

const PERMISSION_LABELS: Record<string, string> = {
  'documents:read': 'อ่านเอกสาร',
  'documents:write': 'อัปโหลด/แก้ไขเอกสาร',
  'meetings:read': 'ดูปฏิทินประชุม',
  'meetings:write': 'จัดการประชุม',
  'indicators:read': 'ดูตัวชี้วัด',
  'indicators:write': 'จัดการตัวชี้วัด',
  'cqi:read': 'ดู CQI',
  'cqi:write': 'จัดการ CQI',
  'km:read': 'ดู KM',
  'km:write': 'จัดการ KM',
  'news:read': 'ดูข่าว',
  'news:write': 'จัดการข่าว',
  'elearning:read': 'ดู E-learning',
  'elearning:write': 'เรียน/จัดการ E-learning',
  'service-profile:read': 'ดู Service Profile',
  'service-profile:write': 'แก้ไข Service Profile',
  'admin:stats': 'สถิติระบบ',
}

export function RolesManagerPage() {
  const { data, isLoading } = useAdminRolesList()

  return (
    <AdminPageShell
      pageKey="admin-roles"
      title="บทบาท & สิทธิ์"
      description="ภาพรวมบทบาทผู้ใช้และสิทธิ์การเข้าถึงแต่ละโมดูล — แก้ไขบทบาทผู้ใช้ได้ที่หน้าจัดการผู้ใช้งาน"
      icon={ShieldCheck}
    >
      <div className="grid gap-4">
        {(data ?? []).map((role) => {
          const perms = getPermissionsForRole(role.name)
          const isFull = perms.includes('*')
          return (
            <SurfaceCard key={role.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/15 px-5 py-4">
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {ROLE_LABELS[role.name] ?? role.displayName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{role.name}</p>
                  {role.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
                {isFull ? (
                  <Badge className="bg-primary/10 text-primary">สิทธิ์เต็มระบบ</Badge>
                ) : (
                  <Badge variant="secondary">{perms.length} สิทธิ์</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {isFull ? (
                  <span className="text-sm text-muted-foreground">เข้าถึงทุกโมดูลและฟีเจอร์</span>
                ) : (
                  perms.map((p) => (
                    <Badge key={p} variant="outline" className="font-normal">
                      {PERMISSION_LABELS[p] ?? p}
                    </Badge>
                  ))
                )}
              </div>
            </SurfaceCard>
          )
        })}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      <SurfaceCard className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>บทบาท</TableHead>
              <TableHead>อัปโหลดเอกสาร</TableHead>
              <TableHead>จัดการเอกสารองค์กร</TableHead>
              <TableHead>ซ่อนเอกสาร</TableHead>
              <TableHead>Service Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {['admin', 'qa_manager', 'document_manager', 'staff', 'viewer'].map((name) => {
              const perms = getPermissionsForRole(name)
              const full = perms.includes('*')
              const docWrite = full || perms.includes('documents:write')
              const orgDocs = ['admin', 'qa_manager', 'document_manager'].includes(name)
              const hide = name === 'admin'
              const spWrite = full || perms.includes('service-profile:write')
              return (
                <TableRow key={name}>
                  <TableCell className="font-medium">{ROLE_LABELS[name] ?? name}</TableCell>
                  <TableCell>{docWrite ? '✓' : '—'}</TableCell>
                  <TableCell>{orgDocs ? '✓ ทุกฉบับ' : docWrite ? 'เฉพาะของตัวเอง' : '—'}</TableCell>
                  <TableCell>{hide ? '✓' : '—'}</TableCell>
                  <TableCell>{spWrite ? '✓' : 'อ่านอย่างเดียว'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </SurfaceCard>
    </AdminPageShell>
  )
}
