import type { ReactNode } from 'react'
import { useStoredFlag } from '../lib/useStoredFlag'
import { Button } from './core/Button'
import { Icon } from './core/Icon'

interface Props {
  /** Unique per tool, e.g. `shorui:intro:pdf-tools:dismissed`. */
  storageKey: string
  title: string
  children: ReactNode
}

/**
 * Generic "what does this tool do" panel, dismissible and remembered per browser.
 * Text Replacer keeps its own bespoke version (ToolIntro.tsx in its folder) with a worked
 * example diagram; every other tool uses this one with plain prose children.
 */
export function ToolIntro({ storageKey, title, children }: Props) {
  const [dismissed, setDismissed] = useStoredFlag(storageKey)

  if (dismissed) {
    return (
      <div>
        <Button variant="ghost" size="sm" iconLeft="info" onClick={() => setDismissed(false)}>
          {title}
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="tool-intro"
      className="relative flex flex-col gap-2 rounded-lg border border-border bg-surface-subtle p-5"
    >
      <button
        type="button"
        aria-label="Dismiss introduction"
        title="Dismiss"
        onClick={() => setDismissed(true)}
        className="focus-ring absolute top-3 right-3 grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-faint hover:bg-surface-hover hover:text-ink"
      >
        <Icon name="x" size={15} />
      </button>
      <h2 id="tool-intro" className="m-0 pr-8 text-h3 font-semibold text-ink">
        {title}
      </h2>
      <div className="flex max-w-[720px] flex-col gap-1.5 text-body text-ink-muted text-pretty">
        {children}
      </div>
    </section>
  )
}
