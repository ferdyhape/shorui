import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  titleId?: string
  description?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  padding?: 12 | 16 | 20 | 24
}

export function Card({
  title,
  titleId,
  description,
  actions,
  footer,
  children,
  padding = 20,
  className = '',
  ...rest
}: Props) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface-card shadow-sm ${className}`}
      {...rest}
    >
      {title || actions ? (
        <header
          className="flex items-start justify-between gap-4"
          style={{ padding: `${padding}px ${padding}px 0` }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? (
              <h3 id={titleId} className="m-0 text-h3 font-semibold text-ink">
                {title}
              </h3>
            ) : null}
            {description ? <p className="m-0 text-body-sm text-ink-faint">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      {children != null ? (
        <div className="min-w-0" style={{ padding, paddingTop: title ? 14 : padding }}>
          {children}
        </div>
      ) : null}
      {footer ? (
        <footer
          className="flex items-center justify-end gap-2 border-t border-border bg-surface-subtle"
          style={{ padding: `10px ${padding}px` }}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
