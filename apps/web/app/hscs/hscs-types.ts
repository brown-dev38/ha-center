import type { HscsScoreBand } from '@/app/hscs/hscs-scoring'

export type HscsViewId =
  | 'overview'
  | 'matrix-executive'
  | 'matrix-public-health'
  | 'matrix-support'
  | 'matrix-medical'
  | 'matrix-nursing'
  | 'matrix-pharmacy'
  | 'matrix-allied-health'
  | 'matrix-other'

export type HscsDashboardScopeId =
  | 'organization'
  | 'physical-therapy'
  | 'finance'
  | 'nursing-special-clinic'
  | 'nursing-infection-control'
  | 'nursing-opd'
  | 'nursing-ward'
  | 'nursing-icu'
  | 'nursing-or-patient'
  | 'nursing-er'
  | 'nursing-anesthesia'
  | 'nursing-labor'
  | 'nursing-or'
  | 'biomedical-engineering'
  | 'general-admin'
  | 'primary-care'
  | 'health-insurance'
  | 'planning-supply'
  | 'quality-development'
  | 'pharmacy'
  | 'radiology'
  | 'medical-records'
  | 'it-digital-health'
  | 'medical-technology'
  | 'medicine'

export type HscsSubItem = {
  code: string
  score: number | null
}

export type HscsDimension = {
  id: string
  number: number
  title: string
  score: number | null
  subItems: HscsSubItem[]
}

export type HscsSummary = {
  overallScore: number | null
  respondents: number
  mainDimensions: number
  subDimensions: number
  urgentCount: number
  urgentItems: number
}

export type HscsDataset = {
  year: number
  viewId: HscsViewId
  scopeId: HscsDashboardScopeId
  summary: HscsSummary
  dimensions: HscsDimension[]
  updatedAt: string
}

export type HscsViewOption = {
  id: HscsViewId
  label: string
  shortLabel: string
}

export type HscsScopeOption = {
  id: HscsDashboardScopeId
  label: string
}

export type HscsBandDisplay = {
  band: HscsScoreBand
  label: string
  range: string
  description: string
}
