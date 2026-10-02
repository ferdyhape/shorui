import { sampleUrl } from '../../api/pdfCompress'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { Input } from '../../components/core/Input'
import { FileDropzone } from '../../components/FileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { formatBytes } from '../../lib/bytes'
import { usePdfCompress } from './usePdfCompress'

export default function PdfCompress() {
  const t = usePdfCompress()
  const reduction =
    t.result && t.result.originalSize > 0
      ? Math.round((1 - t.result.compressedSize / t.result.originalSize) * 100)
      : null

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:pdf-compress:dismissed" title="What does this tool do?">
        <p className="m-0">
          Shrinks a PDF's file size by recompressing its page content and re-encoding its embedded
          images at a lower quality. Works best on image-heavy PDFs (scans, photo reports); a
          mostly-text PDF has little left to compress.
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.result && (
        <Banner kind="info">
          {`${formatBytes(t.result.originalSize)} → ${formatBytes(t.result.compressedSize)} (${reduction}% smaller).`}
        </Banner>
      )}

      <Card title="Document">
        <div className="flex flex-col gap-4">
          <a className={`${buttonClasses('secondary', 'sm')} self-start`} href={sampleUrl} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample image-heavy PDF
          </a>
          <FileDropzone accept=".pdf" disabled={t.busy} onFile={t.chooseFile}>
            {t.file ? `${t.file.name} — click or drop to replace` : 'Choose or drop a .pdf file'}
          </FileDropzone>
        </div>
      </Card>

      <Card title="Output">
        <div className="flex flex-wrap items-end gap-5">
          <Input
            label="Image quality"
            hint="Lower = smaller file, more visible compression (10–95)"
            type="number"
            min={10}
            max={95}
            value={t.quality}
            onChange={(e) => t.setQuality(Number(e.target.value))}
            containerClassName="w-full sm:w-auto sm:min-w-48"
          />
          <Button
            className="w-full sm:ml-auto sm:w-auto"
            iconLeft="minimize-2"
            loading={t.busy}
            disabled={!t.file}
            onClick={t.run}
          >
            {t.busy ? 'Compressing…' : 'Compress PDF'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
