import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { PePageContent } from '@/app/patient-experience/pe-page-content'

export default function PatientExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin text-[#6d28d9]" />
          กำลังโหลด Patient Experience...
        </div>
      }
    >
      <PePageContent />
    </Suspense>
  )
}
