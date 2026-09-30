import type { ReactNode } from 'react'
import { Icon, type IconName } from '../core/Icon'

export interface SidebarItem {
  id: string
  label: string
  icon?: IconName
}

export interface SidebarSection {
  label?: string
  items: SidebarItem[]
}

function Item({
  item,
  active,
  onSelect,
}: {
  item: SidebarItem
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={`focus-ring flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left font-sans text-body-sm transition-colors duration-120 ${
        active
          ? 'bg-surface-selected font-semibold text-ink-brand'
          : 'font-medium text-ink-muted hover:bg-surface-hover hover:text-ink'
      }`}
    >
      {item.icon ? (
        <Icon name={item.icon} size={16} className={active ? 'opacity-100' : 'opacity-75'} />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </button>
  )
}

interface Props {
  sections: SidebarSection[]
  activeId: string | undefined
  onSelect: (id: string) => void
  footer?: ReactNode
  brand?: string
  brandNote?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

/** Collapsing swaps in a narrow rail that keeps a persistent way back. */
export function Sidebar({
  sections,
  activeId,
  onSelect,
  footer,
  brand = 'shorui',
  brandNote,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  if (collapsed) {
    return (
      <nav
        aria-label="Tools"
        className="flex h-full w-11 shrink-0 flex-col items-center border-r border-border bg-surface-nav py-3"
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Show sidebar"
          aria-label="Show sidebar"
          className="focus-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint hover:bg-surface-hover hover:text-ink"
        >
          <Icon name="panel-left-open" size={17} />
        </button>
      </nav>
    )
  }

  return (
    <nav
      aria-label="Tools"
      className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-surface-nav"
    >
      <div className="flex h-[52px] items-center gap-2 border-b border-border px-3.5">
        <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-sm bg-brand font-mono text-caption font-semibold text-ink-inverse">
          S
        </span>
        <span className="min-w-0 flex-1 truncate text-body font-semibold tracking-[-0.02em] text-ink">
          {brand}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {brandNote ? (
            <span className="font-mono text-micro text-ink-faint">{brandNote}</span>
          ) : null}
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Hide sidebar"
              aria-label="Hide sidebar"
              className="focus-ring grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-sm text-ink-faint hover:bg-surface-hover hover:text-ink"
            >
              <Icon name="panel-left-close" size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-2 py-2.5">
        {sections.map((section, i) => (
          <div key={section.label ?? i} className="flex flex-col gap-0.5">
            {section.label ? (
              <div className="px-2 pb-1 text-micro font-semibold uppercase tracking-[0.04em] text-ink-disabled">
                {section.label}
              </div>
            ) : null}
            {section.items.map((item) => (
              <Item key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>

      {footer ? <div className="border-t border-border p-2.5">{footer}</div> : null}
    </nav>
  )
}
