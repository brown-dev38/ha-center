import { HaV6SectionPage } from '@/app/documents/ha-v6-section-page'

export default async function HaV6SectionRoutePage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  return <HaV6SectionPage slug={section} />
}
