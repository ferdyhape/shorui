import { sampleUrl } from '../../api/pdfTools'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { Input } from '../../components/core/Input'
import { MultiFileDropzone } from '../../components/MultiFileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { PageTable } from './PageTable'
import { usePdfTools } from './usePdfTools'

export default function PdfTools() {
  const t = usePdfTools()
  const { files, pages, outputName } = t.state

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:pdf-tools:dismissed" title="What does this tool do?">
        <p className="m-0">
          Combines pages from one or more PDFs into a single PDF. Add files, then reorder, rotate or
          remove individual pages before downloading the result.
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <Card title="Add PDFs">
        <div className="mb-3 flex flex-wrap gap-2">
          <a className={buttonClasses('secondary', 'sm')} href={sampleUrl('sample-a.pdf')} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample PDF A (2 pages)
          </a>
          <a className={buttonClasses('secondary', 'sm')} href={sampleUrl('sample-b.pdf')} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample PDF B (1 page)
          </a>
        </div>
        <MultiFileDropzone
          accept=".pdf"
          disabled={t.busy === 'inspect' || !t.canAddMoreFiles}
          onFiles={t.addFiles}
        >
          {t.busy === 'inspect'
            ? 'Reading…'
            : t.canAddMoreFiles
              ? 'Choose or drop one or more .pdf files'
              : 'File limit reached'}
        </MultiFileDropzone>
        {files.length > 0 && (
          <p className="m-0 mt-2 text-body-sm text-ink-faint">
            {`${files.length} file${files.length > 1 ? 's' : ''} added, ${pages.length} page${
              pages.length === 1 ? '' : 's'
            } total.`}
          </p>
        )}
      </Card>

      {pages.length > 0 && (
        <>
          <Card
            title="Pages"
            actions={
              <Button variant="ghost" size="sm" onClick={t.clearAll}>
                Clear all
              </Button>
            }
          >
            <PageTable
              pages={pages}
              files={files}
              onRotate={(id) => t.dispatch({ type: 'page-rotated', id })}
              onRemove={(id) => t.dispatch({ type: 'page-removed', id })}
              onMove={(id, direction) => t.dispatch({ type: 'page-moved', id, direction })}
            />
          </Card>

          <Card title="Output">
            <div className="flex flex-wrap items-end gap-5">
              <Input
                label="Output file name"
                value={outputName}
                onChange={(e) => t.dispatch({ type: 'output-name-changed', name: e.target.value })}
                containerClassName="w-full sm:w-auto sm:min-w-64"
              />
              <Button
                className="w-full sm:ml-auto sm:w-auto"
                iconLeft="download"
                loading={t.busy === 'process'}
                onClick={t.process}
              >
                {t.busy === 'process' ? 'Generating…' : 'Generate PDF'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
