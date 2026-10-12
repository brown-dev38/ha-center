import type { HscsViewOption } from '@/app/hscs/hscs-types'
import { HSCS_WORK_GROUPS } from '@/app/hscs/hscs-work-groups'

export const HSCS_AVAILABLE_YEARS = [2567, 2568, 2569] as const

export const HSCS_VIEW_OPTIONS: HscsViewOption[] = [
  { id: 'overview', label: 'Dashboard ภาพรวม', shortLabel: 'ภาพรวม' },
  { id: 'matrix-executive', label: 'Color-coded Matrix ผู้บริหาร', shortLabel: 'ผู้บริหาร' },
  {
    id: 'matrix-public-health',
    label: 'Color-coded Matrix วิชาชีพสาธารณสุข',
    shortLabel: 'วิชาชีพสาธารณสุข',
  },
  {
    id: 'matrix-support',
    label: 'Color-coded Matrix บุคลากรสนับสนุนทั่วไป',
    shortLabel: 'บุคลากรสนับสนุน',
  },
  {
    id: 'matrix-medical',
    label: 'Color-coded Matrix วิชาชีพทางการแพทย์',
    shortLabel: 'วิชาชีพแพทย์',
  },
  {
    id: 'matrix-nursing',
    label: 'Color-coded Matrix วิชาชีพทางการพยาบาล',
    shortLabel: 'วิชาชีพพยาบาล',
  },
  {
    id: 'matrix-pharmacy',
    label: 'Color-coded Matrix วิชาชีพทางเภสัชกรรม',
    shortLabel: 'วิชาชีพเภสัชกรรม',
  },
  {
    id: 'matrix-allied-health',
    label: 'Color-coded Matrix วิชาชีพทางสหวิทยาการ',
    shortLabel: 'สหวิทยาการ',
  },
  { id: 'matrix-other', label: 'Color-coded Matrix อื่น ๆ', shortLabel: 'อื่น ๆ' },
]

export const HSCS_SCOPE_OPTIONS = HSCS_WORK_GROUPS
