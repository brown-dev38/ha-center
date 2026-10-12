import { HA_V6_CORE_DOCUMENTS } from '@/app/documents/ha-v6-core-seed'
import { HA_V6_SECTION_I_DOCUMENTS } from '@/app/documents/ha-v6-section-i-seed'
import { HA_V6_SECTION_II_DOCUMENTS } from '@/app/documents/ha-v6-section-ii-seed'
import { HA_V6_SECTION_III_DOCUMENTS } from '@/app/documents/ha-v6-section-iii-seed'
import { HA_V6_SECTION_IV_DOCUMENTS } from '@/app/documents/ha-v6-section-iv-seed'
import { HA_V6_SP_PCT_DOCUMENTS } from '@/app/documents/ha-v6-sp-pct-seed'
import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export const HA_V6_ALL_SEED_DOCUMENTS: HaV6TrackedDocument[] = [
  ...HA_V6_CORE_DOCUMENTS,
  ...HA_V6_SECTION_I_DOCUMENTS,
  ...HA_V6_SECTION_II_DOCUMENTS,
  ...HA_V6_SECTION_III_DOCUMENTS,
  ...HA_V6_SECTION_IV_DOCUMENTS,
  ...HA_V6_SP_PCT_DOCUMENTS,
]
