import { AdminGuard } from '@/app/common/admin-guard'
import { AuditLogsView } from '@/app/admin/audit-logs-view'

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard>
      <AuditLogsView />
    </AdminGuard>
  )
}
