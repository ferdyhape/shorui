import type { ReactNode } from 'react'
import { Button } from '../../components/core/Button'
import { Icon } from '../../components/core/Icon'
import { useStoredFlag } from '../../lib/useStoredFlag'

const CODE = 'rounded-xs bg-surface-hover px-1 py-px font-mono text-caption text-ink'

export const INTRO_DISMISSED_KEY = 'shorui:intro:text-replacer:dismissed'

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border border-border bg-surface-card p-3">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.04em] text-ink-faint">
        {label}
      </span>
      {children}
    </div>
  )
}

/**
 * Plain-language "what is this" for first-time users, with a tiny worked example.
 * Dismissible; the choice is remembered per browser and can be undone from the link left behind.
 */
export function ToolIntro() {
  const [dismissed, setDismissed] = useStoredFlag(INTRO_DISMISSED_KEY)

  if (dismissed) {
    return (
      <div>
        <Button variant="ghost" size="sm" iconLeft="info" onClick={() => setDismissed(false)}>
          What does this tool do?
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="tool-intro"
      className="relative flex flex-col gap-4 rounded-lg border border-border bg-surface-subtle p-5"
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

      <div className="flex flex-col gap-1.5 pr-8">
        <h2 id="tool-intro" className="m-0 text-h3 font-semibold text-ink">
          What does this tool do?
        </h2>
        <p className="m-0 max-w-[720px] text-body text-ink-muted text-pretty">
          Text Replacer turns <strong className="font-semibold text-ink">one Word template</strong>{' '}
          into <strong className="font-semibold text-ink">many finished documents</strong>. Write
          placeholders like <code className={CODE}>{'{{name}}'}</code> in your .docx, fill in a
          table with one row per document, and download the results. It works like mail merge,
          without needing Word or Excel.
        </p>
      </div>

      <div
        className="flex flex-col items-stretch gap-2 md:flex-row md:items-center"
        aria-label="Example"
        role="group"
      >
        <Panel label="Your template">
          <p className="m-0 text-body-sm text-ink">
            Dear <code className={CODE}>{'{{name}}'}</code>, your order{' '}
            <code className={CODE}>{'{{order_no}}'}</code> has shipped.
          </p>
        </Panel>
        <Icon name="arrow-right" size={18} className="hidden self-center text-ink-faint md:block" />
        <Panel label="Your data">
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0 font-mono text-caption text-ink-muted">
            <li>Budi · A-101</li>
            <li>Sari · A-102</li>
          </ul>
        </Panel>
        <Icon name="arrow-right" size={18} className="hidden self-center text-ink-faint md:block" />
        <Panel label="You get">
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0 font-mono text-caption text-ink">
            <li>Budi_letter.docx</li>
            <li>Sari_letter.docx</li>
          </ul>
        </Panel>
      </div>

      <p className="m-0 text-body-sm text-ink-faint">
        Good for letters, certificates, contracts, invoices, or any document you produce again and
        again with different details.
      </p>
    </section>
  )
}
