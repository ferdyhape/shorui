import { Icon, type IconName } from './core/Icon'

interface Props {
  files: File[]
  onRemove: (index: number) => void
  icon?: IconName
}

/** A list of already-added files with a per-file remove button. Shared by any multi-file tool. */
export function FileList({ files, onRemove, icon = 'file-text' }: Props) {
  if (files.length === 0) return null
  return (
    <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
      {files.map((file, i) => (
        <li
          key={`${file.name}-${i}`}
          className="flex items-center gap-2 rounded-md border border-border bg-surface-card px-2.5 py-1.5 text-body-sm text-ink"
        >
          <Icon name={icon} size={15} className="shrink-0 text-ink-faint" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove(i)}
            className="focus-ring inline-grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-sm text-ink-faint hover:bg-drift-bg hover:text-drift"
          >
            <Icon name="x" size={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}
