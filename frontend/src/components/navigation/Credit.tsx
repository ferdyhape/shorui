import { AUTHOR } from '../../lib/brand'

export function Credit() {
  return (
    <p className="m-0 text-right text-micro text-ink-faint">
      by{' '}
      <a
        href={AUTHOR.url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring rounded-xs font-medium text-ink-muted no-underline hover:text-ink-brand hover:underline"
      >
        {AUTHOR.name}
      </a>
    </p>
  )
}
