import { sampleUrl } from '../../api/docxToPdf'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { FileDropzone } from '../../components/FileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { useDocxToPdf } from './useDocxToPdf'

export default function DocxToPdf() {
  const { file, busy, error, notice, chooseFile, convert } = useDocxToPdf()

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:docx-to-pdf:dismissed" title="What does this tool do?">
        <p className="m-0">
          Converts a Word document to a PDF, laid out exactly like Word would print it (fonts, page
          breaks, tables). Useful when you need a document that looks the same on every computer and
          can't be edited by accident.
        </p>
      </ToolIntro>

      {error && <Banner kind="error">{error}</Banner>}
      {notice && <Banner kind="info">{notice}</Banner>}

      <Card title="Document">
        <div className="flex flex-col gap-4">
          <a className={`${buttonClasses('secondary', 'sm')} self-start`} href={sampleUrl} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample .docx
          </a>
          <FileDropzone accept=".docx" disabled={busy} onFile={chooseFile}>
            {file ? `${file.name} — click or drop to replace` : 'Choose or drop a .docx file'}
          </FileDropzone>
          <Button
            className="w-full sm:w-auto sm:self-end"
            iconLeft="file-output"
            loading={busy}
            disabled={!file}
            onClick={convert}
          >
            {busy ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
