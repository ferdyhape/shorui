import { sampleUrl } from '../../api/imageToPdf'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/core/Button'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Card } from '../../components/core/Card'
import { Icon } from '../../components/core/Icon'
import { Input } from '../../components/core/Input'
import { FileList } from '../../components/FileList'
import { MultiFileDropzone } from '../../components/MultiFileDropzone'
import { ToolIntro } from '../../components/ToolIntro'
import { useImageToPdf } from './useImageToPdf'

export default function ImageToPdf() {
  const t = useImageToPdf()

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro storageKey="shorui:intro:image-to-pdf:dismissed" title="What does this tool do?">
        <p className="m-0">
          Combines one or more photos or images (JPG, PNG, WebP, BMP, GIF, TIFF) into a single PDF,
          one image per page, in the order you add them.
        </p>
      </ToolIntro>

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <Card title="Images">
        <div className="mb-3 flex flex-wrap gap-2">
          <a className={buttonClasses('secondary', 'sm')} href={sampleUrl('sample-1.jpg')} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample photo 1
          </a>
          <a className={buttonClasses('secondary', 'sm')} href={sampleUrl('sample-2.jpg')} download>
            <Icon name="download" size={14} className="mr-1.5" />
            Sample photo 2
          </a>
        </div>
        <MultiFileDropzone accept="image/*" disabled={!t.canAddMoreFiles} onFiles={t.addFiles}>
          {t.canAddMoreFiles ? 'Choose or drop one or more images' : 'File limit reached'}
        </MultiFileDropzone>
        <FileList files={t.files} onRemove={t.removeFile} icon="image" />
      </Card>

      <Card title="Output">
        <div className="flex flex-wrap items-end gap-5">
          <Input
            label="Output file name"
            value={t.outputName}
            onChange={(e) => t.setOutputName(e.target.value)}
            containerClassName="w-full sm:w-auto sm:min-w-64"
          />
          <Button
            className="w-full sm:ml-auto sm:w-auto"
            iconLeft="download"
            loading={t.busy}
            onClick={t.run}
          >
            {t.busy ? 'Generating…' : 'Generate PDF'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
