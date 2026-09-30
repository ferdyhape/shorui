import { Card } from '../../components/core/Card'
import { FileDropzone } from '../../components/FileDropzone'
import { StepBadge } from './StepBadge'
import { TemplateGuide } from './TemplateGuide'

interface Props {
  file: File | null
  variables: string[]
  busy: boolean
  onFile: (file: File) => void
}

export function TemplateStep({ file, variables, busy, onFile }: Props) {
  return (
    <Card
      aria-labelledby="step-template"
      titleId="step-template"
      title={
        <>
          <StepBadge n={1} /> Template
        </>
      }
    >
      <TemplateGuide />
      <FileDropzone accept=".docx" disabled={busy} onFile={onFile}>
        {busy
          ? 'Reading…'
          : file
            ? `${file.name} — click or drop to replace`
            : 'Choose or drop a .docx with {{variable}} placeholders'}
      </FileDropzone>
      {file && (
        <ul
          className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0"
          aria-label="Detected variables"
        >
          {variables.length ? (
            variables.map((v) => (
              <li key={v}>
                <code className="rounded-xs border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-mono text-caption text-ink-brand">{`{{${v}}}`}</code>
              </li>
            ))
          ) : (
            <li className="text-body-sm text-ink-faint">
              No {'{{variables}}'} found in this document.
            </li>
          )}
        </ul>
      )}
    </Card>
  )
}
