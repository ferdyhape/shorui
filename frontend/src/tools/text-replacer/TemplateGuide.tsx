import { sampleUrl } from '../../api/textReplacer'
import { buttonClasses } from '../../components/core/buttonStyles'
import { Icon } from '../../components/core/Icon'

const CODE = 'rounded-xs bg-surface-hover px-1 py-px font-mono text-caption text-ink'

export function TemplateGuide() {
  return (
    <details className="group mb-4 rounded-md border border-border bg-surface-subtle">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-body-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <Icon
          name="chevron-right"
          size={14}
          className="text-ink-faint transition-transform duration-120 group-open:rotate-90"
        />
        How to prepare your template
      </summary>
      <div className="flex flex-col gap-3 px-3.5 pb-3.5">
        <div className="flex flex-wrap gap-2">
          <a className={buttonClasses('secondary')} href={sampleUrl('template.docx')} download>
            <Icon name="download" size={16} className="mr-1.5" />
            Sample template (.docx)
          </a>
          <a className={buttonClasses('secondary')} href={sampleUrl('data.csv')} download>
            <Icon name="download" size={16} className="mr-1.5" />
            Matching sample data (.csv)
          </a>
        </div>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-body-sm text-ink-muted">
          <li>
            Type each variable as <code className={CODE}>{'{{variable_name}}'}</code>. Use letters,
            numbers and underscores. Names are case-sensitive:{' '}
            <code className={CODE}>{'{{Name}}'}</code> and{' '}
            <code className={CODE}>{'{{name}}'}</code> are different variables.
          </li>
          <li>
            Format the placeholder the way you want the final value to look. Bold, italic, font and
            size carry over. Format the whole <code className={CODE}>{'{{...}}'}</code> as one
            piece.
          </li>
          <li>
            Placeholders work in the body, tables, headers, footers and text boxes. Using the same
            variable several times fills every place with the same value.
          </li>
          <li>Not replaced: footnotes, endnotes, comments, images and charts.</li>
          <li>
            Empty cells leave the placeholder blank. A line break inside a value becomes a line
            break in the document.
          </li>
          <li>
            Save as <code className={CODE}>.docx</code> (not the old{' '}
            <code className={CODE}>.doc</code>). For imported data, the first row must hold the
            variable names.
          </li>
        </ul>
      </div>
    </details>
  )
}
