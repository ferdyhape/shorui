import { sampleUrl } from '../../api/pdfTools'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Checkbox } from '../../components/core/Checkbox'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { Input } from '../../components/core/Input'
import { FileDropzone } from '../../components/FileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { usePdfStamp } from './usePdfStamp'

export default function PdfStamp() {
  const t = usePdfStamp()

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:pdf-stamp:dismissed" title="What does this tool do?">
        <p className="m-0">
          Adds a diagonal watermark (e.g. "DRAFT" or "CONFIDENTIAL") and/or "Page N of M" page
          numbers to every page of a PDF.
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <Card title="Document">
        <div className="flex flex-col gap-4">
          <a
            className={`${buttonClasses('secondary', 'sm')} self-start`}
            href={sampleUrl('sample-a.pdf')}
            download
          >
            <Icon name="download" size={14} className="mr-1.5" />
            Sample PDF (from PDF Tools)
          </a>
          <FileDropzone accept=".pdf" disabled={t.busy} onFile={t.chooseFile}>
            {t.file ? `${t.file.name} — click or drop to replace` : 'Choose or drop a .pdf file'}
          </FileDropzone>
        </div>
      </Card>

      <Card title="Stamp">
        <div className="flex flex-col gap-4">
          <Input
            label="Watermark text"
            placeholder="e.g. DRAFT"
            value={t.options.watermarkText}
            onChange={(e) => t.setOptions((prev) => ({ ...prev, watermarkText: e.target.value }))}
            containerClassName="w-full sm:max-w-72"
          />
          <Checkbox
            label="Add page numbers"
            hint='"Page N of M" at the bottom of every page'
            checked={t.options.pageNumbers}
            onChange={(e) => t.setOptions((prev) => ({ ...prev, pageNumbers: e.target.checked }))}
          />
        </div>
      </Card>

      <Card title="Output">
        <Button
          className="w-full sm:w-auto"
          iconLeft="stamp"
          loading={t.busy}
          disabled={!t.file}
          onClick={t.run}
        >
          {t.busy ? 'Stamping…' : 'Stamp PDF'}
        </Button>
      </Card>
    </div>
  )
}
