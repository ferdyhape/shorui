import { memo } from 'react'
import { Icon } from '../../components/core/Icon'
import type { Row } from './rows'

interface RowViewProps {
  row: Row
  index: number
  variables: string[]
  onChange: (id: number, variable: string, value: string) => void
  onRemove: (id: number) => void
  onDuplicate: (id: number) => void
  canDuplicate: boolean
}

const CELL = 'border-b border-border p-0'
const ACTIONS_CELL =
  'sticky right-0 z-10 w-[76px] whitespace-nowrap px-1 text-center shadow-[-1px_0_0_var(--color-border)]'

// memo + stable callbacks: typing in one row does not re-render the other 999.
const RowView = memo(function RowView({
  row,
  index,
  variables,
  onChange,
  onRemove,
  onDuplicate,
  canDuplicate,
}: RowViewProps) {
  return (
    <tr className="group hover:bg-surface-hover-subtle">
      <td className={`${CELL} w-9 text-center font-mono text-micro text-ink-disabled`}>
        {index + 1}
      </td>
      {variables.map((v) => (
        <td key={v} className={CELL}>
          <input
            value={row.values[v] ?? ''}
            onChange={(e) => onChange(row.id, v, e.target.value)}
            aria-label={`${v}, row ${index + 1}`}
            className="h-[var(--control-height-md)] w-full min-w-36 border-none bg-transparent px-2.5 font-sans text-body-sm text-ink outline-none focus:bg-surface-selected focus:shadow-[inset_0_0_0_1.5px_var(--color-border-focus)]"
          />
        </td>
      ))}
      {/* Sticky to the right edge: always reachable, even when the table scrolls sideways. */}
      <td className={`${CELL} ${ACTIONS_CELL} bg-surface-card group-hover:bg-surface-hover-subtle`}>
        <button
          type="button"
          aria-label={`Copy row ${index + 1}`}
          title={canDuplicate ? 'Copy row' : 'Row limit reached'}
          disabled={!canDuplicate}
          onClick={() => onDuplicate(row.id)}
          className="focus-ring inline-grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Icon name="copy" size={15} />
        </button>
        <button
          type="button"
          aria-label={`Delete row ${index + 1}`}
          onClick={() => onRemove(row.id)}
          className="focus-ring inline-grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-drift-bg hover:text-drift"
        >
          <Icon name="x" size={15} />
        </button>
      </td>
    </tr>
  )
})

interface Props {
  rows: Row[]
  variables: string[]
  onChange: RowViewProps['onChange']
  onRemove: RowViewProps['onRemove']
  onDuplicate: RowViewProps['onDuplicate']
  canDuplicate: boolean
}

const TH =
  'sticky top-0 border-b border-border bg-surface-sunken px-2.5 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.04em] whitespace-nowrap text-ink-faint'

export function RowsTable({
  rows,
  variables,
  onChange,
  onRemove,
  onDuplicate,
  canDuplicate,
}: Props) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} w-9 text-center`} scope="col">
              #
            </th>
            {variables.map((v) => (
              <th key={v} className={TH} scope="col">
                {v}
              </th>
            ))}
            <th
              className={`${TH} sticky right-0 z-20 w-[76px] shadow-[-1px_0_0_var(--color-border)]`}
              scope="col"
            >
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <RowView
              key={r.id}
              row={r}
              index={i}
              variables={variables}
              onChange={onChange}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              canDuplicate={canDuplicate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
