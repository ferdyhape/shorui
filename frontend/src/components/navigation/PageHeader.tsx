import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, meta }: Props) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-surface-card px-[var(--page-gutter)] pt-[18px] pb-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-h1 font-semibold text-ink">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="m-0 max-w-[720px] text-body text-ink-faint text-pretty">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
