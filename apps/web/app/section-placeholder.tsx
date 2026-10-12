import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/app/page-header'
import { EmptyState } from '@/app/empty-state'
import { cn } from '@/app/common/utils'

type SectionPlaceholderProps = {
  title: string
  description?: string
  icon?: LucideIcon
}


export function SectionPlaceholder({ title, description, icon: Icon }: SectionPlaceholderProps) {
  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <PageHeader title={title} description={description} />
      {Icon && (
        <EmptyState
          icon={Icon}
          title="กำลังจัดเตรียมเนื้อหา"
          description="ส่วนนี้จะเชื่อมต่อ API และแสดงข้อมูลจริงในขั้นตอนถัดไป"
        />
      )}
    </div>

  )
}




 
