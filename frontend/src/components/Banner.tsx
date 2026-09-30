import { Icon } from './core/Icon'

interface Props {
  kind: 'error' | 'info'
  children: string
}

const STYLES = {
  error: 'border-drift-border bg-drift-bg text-drift',
  info: 'border-match-border bg-match-bg text-match',
} as const

export function Banner({ kind, children }: Props) {
  // role="alert" interrupts screen readers; "status" announces politely.
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-body-sm ${STYLES[kind]}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <Icon
        name={kind === 'error' ? 'circle-alert' : 'circle-check'}
        size={16}
        className="mt-0.5"
      />
      <span>{children}</span>
    </div>
  )
}
