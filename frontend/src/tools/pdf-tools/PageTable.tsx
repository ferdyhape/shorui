import { memo } from 'react'
import { Icon } from '../../components/core/Icon'
import { pageLabel, type PageItem, type SourceFile } from './pages'

interface RowProps {
  item: PageItem
  index: number
  total: number
  files: SourceFile[]
  onRotate: (id: number) => void
  onRemove: (id: number) => void
  onMove: (id: number, direction: 'up' | 'down') => void
}

const CELL = 'border-b border-border p-0'
const ACTIONS_CELL =
  'sticky right-0 z-10 w-[132px] whitespace-nowrap px-1 text-center shadow-[-1px_0_0_var(--color-border)]'
const ACTION_BTN =
  'focus-ring inline-grid h-7 w-7 pointer-coarse:h-9 pointer-coarse:w-9 cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-muted'

// memo + stable callbacks: re-ordering one page does not re-render every other page.
const Row = memo(function Row({ item, index, total, files, onRotate, onRemove, onMove }: RowProps) {
  const label = pageLabel(files, item)
  return (
    <tr className="group hover:bg-surface-hover-subtle">
      <td className={`${CELL} w-9 text-center font-mono text-micro text-ink-disabled`}>
        {index + 1}
      </td>
      <td className={`${CELL} px-2.5 py-2 text-body-sm text-ink`}>{label}</td>
      <td className={`${CELL} px-2.5 py-2 text-center font-mono text-caption text-ink-faint`}>
        {item.rotate}°
      </td>
      <td className={`${CELL} ${ACTIONS_CELL} bg-surface-card group-hover:bg-surface-hover-subtle`}>
        <button
          type="button"
          aria-label={`Move page ${index + 1} up`}
          disabled={index === 0}
          onClick={() => onMove(item.id, 'up')}
          className={ACTION_BTN}
        >
          <Icon name="arrow-up" size={15} />
        </button>
        <button
          type="button"
          aria-label={`Move page ${index + 1} down`}
          disabled={index === total - 1}
          onClick={() => onMove(item.id, 'down')}
          className={ACTION_BTN}
        >
          <Icon name="arrow-down" size={15} />
        </button>
        <button
          type="button"
          aria-label={`Rotate page ${index + 1}`}
          onClick={() => onRotate(item.id)}
          className={ACTION_BTN}
        >
          <Icon name="rotate-cw" size={15} />
        </button>
        <button
          type="button"
          aria-label={`Remove page ${index + 1}`}
          onClick={() => onRemove(item.id)}
          className={`${ACTION_BTN} hover:bg-drift-bg hover:text-drift`}
        >
          <Icon name="x" size={15} />
        </button>
      </td>
    </tr>
  )
})

interface Props {
  pages: PageItem[]
  files: SourceFile[]
  onRotate: (id: number) => void
  onRemove: (id: number) => void
  onMove: (id: number, direction: 'up' | 'down') => void
}

const TH =
  'sticky top-0 border-b border-border bg-surface-sunken px-2.5 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.04em] whitespace-nowrap text-ink-faint'

export function PageTable({ pages, files, onRotate, onRemove, onMove }: Props) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} w-9 text-center`} scope="col">
              #
            </th>
            <th className={TH} scope="col">
              Page
            </th>
            <th className={`${TH} text-center`} scope="col">
              Rotation
            </th>
            <th
              className={`${TH} sticky right-0 z-20 w-[132px] shadow-[-1px_0_0_var(--color-border)]`}
              scope="col"
            >
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pages.map((item, i) => (
            <Row
              key={item.id}
              item={item}
              index={i}
              total={pages.length}
              files={files}
              onRotate={onRotate}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
