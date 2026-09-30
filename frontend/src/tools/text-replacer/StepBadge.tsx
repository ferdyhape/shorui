export function StepBadge({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="mr-2 inline-grid h-[22px] w-[22px] place-items-center rounded-sm bg-brand align-middle font-mono text-caption font-semibold text-ink-inverse"
    >
      {n}
    </span>
  )
}
