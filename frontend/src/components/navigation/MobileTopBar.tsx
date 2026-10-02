import { Icon } from '../core/Icon'

interface Props {
  open: boolean
  onToggle: () => void
  brand?: string
}

/** Phone-only bar (hidden from md up) holding the button that opens the navigation drawer. */
export function MobileTopBar({ open, onToggle, brand = 'shorui' }: Props) {
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-surface-nav px-[var(--page-gutter)] md:hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="app-navigation"
        className="focus-ring -ml-2 grid h-[var(--control-height-touch)] w-[var(--control-height-touch)] cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink"
      >
        <Icon name="menu" size={20} />
      </button>
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-sm bg-brand font-mono text-caption font-semibold text-ink-inverse">
        S
      </span>
      <span className="text-body font-semibold tracking-[-0.02em] text-ink">{brand}</span>
    </div>
  )
}
