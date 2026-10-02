import { sampleUrl } from '../../api/bulkReplace'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { MultiFileDropzone } from '../../components/MultiFileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { FileList } from '../../components/FileList'
import { PairsTable } from './PairsTable'
import { useBulkReplace } from './useBulkReplace'

export default function BulkReplace() {
  const t = useBulkReplace()

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:bulk-replace:dismissed" title="What does this tool do?">
        <p className="m-0">
          Replaces plain text across many Word documents at once: give it a list of "find" and
          "replace with" pairs, upload the files, and every match in every file is updated the same
          way. No{' '}
          <code className="rounded-xs bg-surface-hover px-1 py-px font-mono text-caption text-ink">
            {'{{variable}}'}
          </code>{' '}
          markup needed — it matches the text exactly as it already appears.
        </p>
        <p className="m-0">
          The sample letters below both mention "Acme Corp" several times (including the letterhead)
          — try finding{' '}
          <code className="rounded-xs bg-surface-hover px-1 py-px font-mono text-caption text-ink">
            Acme Corp
          </code>{' '}
          and replacing it with something else.
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <Card title="Documents">
        <div className="mb-3 flex flex-wrap gap-2">
          <a
            className={buttonClasses('secondary', 'sm')}
            href={sampleUrl('letter-budi.docx')}
            download
          >
            <Icon name="download" size={14} className="mr-1.5" />
            Sample letter 1
          </a>
          <a
            className={buttonClasses('secondary', 'sm')}
            href={sampleUrl('letter-sari.docx')}
            download
          >
            <Icon name="download" size={14} className="mr-1.5" />
            Sample letter 2
          </a>
        </div>
        <MultiFileDropzone accept=".docx" disabled={!t.canAddMoreFiles} onFiles={t.addFiles}>
          {t.canAddMoreFiles ? 'Choose or drop one or more .docx files' : 'File limit reached'}
        </MultiFileDropzone>
        <FileList files={t.files} onRemove={t.removeFile} />
      </Card>

      <Card
        title="Find & replace"
        actions={
          t.state.pairs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => t.dispatch({ type: 'pairs-cleared' })}>
              Clear all
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <PairsTable
            pairs={t.state.pairs}
            onChange={(id, field, value) => t.dispatch({ type: 'cell-changed', id, field, value })}
            onRemove={(id) => t.dispatch({ type: 'pair-removed', id })}
          />
          <Button
            variant="secondary"
            size="sm"
            iconLeft="plus"
            disabled={!t.canAddMorePairs}
            onClick={t.addPair}
          >
            Add row
          </Button>
        </div>
      </Card>

      <Card title="Output">
        <Button
          className="w-full sm:w-auto"
          iconLeft="download"
          loading={t.busy === 'process'}
          onClick={t.process}
        >
          {t.busy === 'process'
            ? 'Generating…'
            : t.files.length > 1
              ? `Replace in ${t.files.length} documents (.zip)`
              : 'Replace and download'}
        </Button>
      </Card>
    </div>
  )
}
