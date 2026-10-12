import { SERVICE_JOURNEY } from '@/app/service-profile/service-profile'

export function ServiceJourney() {
  return (
    <ol className="relative grid gap-0 md:grid-cols-5 md:gap-0">
      {SERVICE_JOURNEY.map((step, i) => (
        <li key={step.step} className="relative flex md:flex-col md:items-center">
          {i < SERVICE_JOURNEY.length - 1 && (
            <div
              className="absolute left-5 top-10 hidden h-px w-full bg-gradient-to-r from-primary/30 to-[var(--ha-green)]/30 md:left-[50%] md:top-5 md:block md:h-px md:w-full"
              aria-hidden
            />
          )}
          <div className="flex gap-4 pb-8 md:flex-col md:items-center md:pb-0 md:text-center">
            <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md ring-4 ring-white">
              {step.step}
            </div>
            <div className="min-w-0 flex-1 md:mt-4 md:px-2">
              {step.duration && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ha-green)]">
                  {step.duration}
                </p>
              )}
              <p className="mt-0.5 font-semibold text-foreground">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
