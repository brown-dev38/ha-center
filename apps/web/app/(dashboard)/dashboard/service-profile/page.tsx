import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ServiceProfilePageContent } from '@/app/service-profile/service-profile-page-content'

export default function ServiceProfileDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <ServiceProfilePageContent />
    </Suspense>
  )
}
