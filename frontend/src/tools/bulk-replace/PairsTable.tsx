import { memo } from 'react'
import { Icon } from '../../components/core/Icon'
import type { Pair } from './pairs'

interface RowProps {
  pair: Pair
  index: number
  onChange: (id: number, field: 'find' | 'replace', value: string) => void
  onRemove: (id: number) => void
}

const CELL = 'border-b border-border p-0'
const INPUT =
  'h-[var(--control-height-md)] pointer-coarse:h-[var(--control-height-touch)] w-full min-w-36 border-none bg-transparent px-2.5 font-sans text-body-sm text-ink outline-none focus:bg-surface-selected focus:shadow-[inset_0_0_0_1.5px_var(--color-border-focus)]'

const Row = memo(function Row({ pair, index, onChange, onRemove }: RowProps) {
  return (
    <tr className="hover:bg-surface-hover-subtle">
      <td className={`${CELL} w-9 text-center font-mono text-micro text-ink-disabled`}>
        {index + 1}
      </td>
      <td className={CELL}>
        <input
          value={pair.find}
          onChange={(e) => onChange(pair.id, 'find', e.target.value)}
          aria-label={`Find, row ${index + 1}`}
          className={INPUT}
        />
      </td>
      <td className={CELL}>
        <input
          value={pair.replace}
          onChange={(e) => onChange(pair.id, 'replace', e.target.value)}
          aria-label={`Replace with, row ${index + 1}`}
          className={INPUT}
        />
      </td>
      <td className={`${CELL} w-9 text-center`}>
        <button
          type="button"
          aria-label={`Delete row ${index + 1}`}
          onClick={() => onRemove(pair.id)}
          className="focus-ring inline-grid h-7 w-7 pointer-coarse:h-9 pointer-coarse:w-9 cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-drift-bg hover:text-drift"
        >
          <Icon name="x" size={15} />
        </button>
      </td>
    </tr>
  )
})

interface Props {
  pairs: Pair[]
  onChange: RowProps['onChange']
  onRemove: RowProps['onRemove']
}

const TH =
  'sticky top-0 border-b border-border bg-surface-sunken px-2.5 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.04em] whitespace-nowrap text-ink-faint'

export function PairsTable({ pairs, onChange, onRemove }: Props) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} w-9 text-center`} scope="col">
              #
            </th>
            <th className={TH} scope="col">
              Find
            </th>
            <th className={TH} scope="col">
              Replace with
            </th>
            <th className={`${TH} w-9`} scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, i) => (
            <Row key={pair.id} pair={pair} index={i} onChange={onChange} onRemove={onRemove} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
