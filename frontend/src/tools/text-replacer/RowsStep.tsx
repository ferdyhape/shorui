import { useCallback, useEffect, useRef, type Dispatch } from 'react'
import { Button } from '../../components/core/Button'
import { Card } from '../../components/core/Card'
import { csvHeaderTemplate, saveBlob } from '../../lib/download'
import type { Action } from './reducer'
import { RowsTable } from './RowsTable'
import { nextRowId, type Row } from './rows'
import { StepBadge } from './StepBadge'

interface Props {
  rows: Row[]
  variables: string[]
  importing: boolean
  canAddRow: boolean
  /** Changes when a template is (re)loaded: move focus to the first data cell. */
  focusToken: number
  dispatch: Dispatch<Action>
  onAddRow: () => void
  onImport: (file: File) => void
}

export function RowsStep({
  rows,
  variables,
  importing,
  canAddRow,
  focusToken,
  dispatch,
  onAddRow,
  onImport,
}: Props) {
  const importRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // focus() scrolls the input into view, so the user lands right on the data entry.
    bodyRef.current?.querySelector<HTMLInputElement>('tbody input')?.focus()
  }, [focusToken])

  const onChange = useCallback(
    (id: number, variable: string, value: string) =>
      dispatch({ type: 'cell-changed', id, variable, value }),
    [dispatch],
  )
  const onRemove = useCallback((id: number) => dispatch({ type: 'row-removed', id }), [dispatch])
  const onDuplicate = useCallback(
    (id: number) => dispatch({ type: 'row-duplicated', id, newId: nextRowId() }),
    [dispatch],
  )

  return (
    <Card
      aria-labelledby="step-rows"
      titleId="step-rows"
      title={
        <>
          <StepBadge n={2} /> Data rows
        </>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            iconLeft="download"
            onClick={() =>
              saveBlob(
                new Blob([csvHeaderTemplate(variables)], { type: 'text/csv' }),
                'data-template.csv',
              )
            }
          >
            CSV template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft="upload"
            loading={importing}
            onClick={() => importRef.current?.click()}
          >
            {importing ? 'Importing…' : 'Import CSV / Excel'}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".csv,.xlsx,.xlsm"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onImport(file)
            }}
          />
        </>
      }
    >
      <div ref={bodyRef} className="flex flex-col gap-3">
        <RowsTable
          rows={rows}
          variables={variables}
          onChange={onChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          canDuplicate={canAddRow}
        />
        <div className="flex gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            iconLeft="plus"
            disabled={!canAddRow}
            onClick={onAddRow}
          >
            Add row
          </Button>
          {rows.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'rows-cleared' })}>
              Clear all
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
