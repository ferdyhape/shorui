import { Button } from '../../components/core/Button'
import { Card } from '../../components/core/Card'
import { Select } from '../../components/core/Select'
import { StepBadge } from './StepBadge'

interface Props {
  variables: string[]
  filenameKey: string
  previewName: string
  documentCount: number
  generating: boolean
  onKeyChange: (key: string) => void
  onGenerate: () => void
}

export function OutputStep({
  variables,
  filenameKey,
  previewName,
  documentCount,
  generating,
  onKeyChange,
  onGenerate,
}: Props) {
  const options = [
    { value: '', label: '(none — number only)' },
    ...variables.map((v) => ({ value: v, label: v })),
  ]
  return (
    <Card
      aria-labelledby="step-output"
      titleId="step-output"
      title={
        <>
          <StepBadge n={3} /> Output
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-5">
        <Select
          label="File name prefix from"
          value={filenameKey}
          options={options}
          onChange={(e) => onKeyChange(e.target.value)}
          containerClassName="w-full sm:w-auto sm:min-w-56"
        />
        <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto">
          <span className="text-body-sm font-medium text-ink-muted">Preview</span>
          <code className="flex h-[var(--control-height-md)] items-center truncate rounded-md border border-border bg-surface-sunken px-2.5 font-mono text-body-sm text-ink">
            {previewName}
          </code>
        </div>
        <Button
          className="w-full sm:ml-auto sm:w-auto"
          iconLeft="download"
          loading={generating}
          disabled={documentCount === 0}
          onClick={onGenerate}
        >
          {generating
            ? 'Generating…'
            : documentCount > 1
              ? `Generate ${documentCount} documents (.zip)`
              : 'Generate document'}
        </Button>
      </div>
    </Card>
  )
}
