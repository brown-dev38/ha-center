import type { PeDepartmentOption, PePeriodOption } from '@/app/patient-experience/pe-types'
import { PE_SURVEY_DEPARTMENTS } from '@/app/patient-experience/pe-survey-form-content'

/** หน่วยงานตามแบบประเมินรับฟังความคิดเห็นผู้ป่วย */
export const PE_DEPARTMENTS: PeDepartmentOption[] = [
  { id: 'all', label: 'ภาพรวมทั้งหมด' },
  ...PE_SURVEY_DEPARTMENTS.map((d) => ({
    id: d.id,
    label: d.label,
    group: d.group,
  })),
]

export const PE_PERIODS: PePeriodOption[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'last-30', label: '30 วันล่าสุด' },
  { id: 'last-90', label: '90 วันล่าสุด' },
  { id: 'q1', label: 'ไตรมาส 1' },
  { id: 'q2', label: 'ไตรมาส 2' },
  { id: 'q3', label: 'ไตรมาส 3' },
  { id: 'q4', label: 'ไตรมาส 4' },
]
