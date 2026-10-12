/** สีกราฟตามแบรนด์ HA Quality Document Pro */
export const CHART_COLORS = {
  primary: '#6d28d9',
  primaryLight: '#8b5cf6',
  secondary: '#a855f7',
  green: '#0d9488',
  greenLight: '#2dd4bf',
  gold: '#d97706',
  sky: '#0284c7',
  rose: '#e11d48',
  slate: '#64748b',
} as const

/** ชุดสีสำหรับ series หลายชุด (bar/line/donut) */
export const CHART_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.green,
  CHART_COLORS.gold,
  CHART_COLORS.sky,
  CHART_COLORS.secondary,
  CHART_COLORS.rose,
  CHART_COLORS.greenLight,
  CHART_COLORS.slate,
] as const

export const CHART_GRID_COLOR = 'rgba(15, 23, 42, 0.06)'
export const CHART_AXIS_COLOR = 'rgba(100, 116, 139, 0.9)'

export const chartAxisTick = {
  fontSize: 11,
  fill: CHART_AXIS_COLOR,
} as const
