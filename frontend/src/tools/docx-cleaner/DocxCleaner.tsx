import { sampleUrl } from '../../api/docxCleaner'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Checkbox } from '../../components/core/Checkbox'
import { Icon } from '../../components/core/Icon'
import { FileDropzone } from '../../components/FileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { useDocxCleaner } from './useDocxCleaner'

export default function DocxCleaner() {
  const t = useDocxCleaner()

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:docx-cleaner:dismissed" title="What does this tool do?">
        <p className="m-0">
          Strips things a Word document can carry without you noticing before you share it: the
          author's name and other file properties, reviewer comments, and tracked changes
          (insertions are kept as plain text, deletions are dropped).
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <Card title="Document">
        <div className="flex flex-col gap-4">
          <a className={`${buttonClasses('secondary', 'sm')} self-start`} href={sampleUrl} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample .docx (has properties, a comment and a tracked change)
          </a>
          <FileDropzone accept=".docx" disabled={t.busy} onFile={t.chooseFile}>
            {t.file ? `${t.file.name} — click or drop to replace` : 'Choose or drop a .docx file'}
          </FileDropzone>
        </div>
      </Card>

      <Card title="What to remove">
        <div className="flex flex-col gap-3">
          <Checkbox
            label="Document properties"
            hint="Author, last modified by, title, keywords, comments summary"
            checked={t.options.stripProperties}
            onChange={() => t.toggle('stripProperties')}
          />
          <Checkbox
            label="Reviewer comments"
            hint="Removes the highlighted ranges and comment markers"
            checked={t.options.stripComments}
            onChange={() => t.toggle('stripComments')}
          />
          <Checkbox
            label="Tracked changes"
            hint="Keeps inserted text, drops deleted text, like Accept All in Word"
            checked={t.options.acceptRevisions}
            onChange={() => t.toggle('acceptRevisions')}
          />
        </div>
      </Card>

      <Card title="Output">
        <Button
          className="w-full sm:w-auto"
          iconLeft="eraser"
          loading={t.busy}
          disabled={!t.file}
          onClick={t.run}
        >
          {t.busy ? 'Cleaning…' : 'Clean document'}
        </Button>
      </Card>
    </div>
  )
}
