import { AdminGuard } from '@/app/common/admin-guard'
import { ConsultRequestsView } from '@/app/admin/consult-requests-view'

export default function AdminConsultRequestsPage() {
  return (
    <AdminGuard>
      <ConsultRequestsView />
    </AdminGuard>
  )
}
