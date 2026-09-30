import { Banner } from '../../components/Banner'
import { OutputStep } from './OutputStep'
import { RowsStep } from './RowsStep'
import { isBlank, previewFileName } from './rows'
import { TemplateStep } from './TemplateStep'
import { ToolIntro } from './ToolIntro'
import { useTextReplacer } from './useTextReplacer'

export default function TextReplacer() {
  const t = useTextReplacer()
  const { file, variables, rows, filenameKey } = t.state
  const documentCount = rows.filter((r) => !isBlank(r)).length
  const previewName = previewFileName(
    file?.name ?? '',
    filenameKey,
    rows[0]?.values[filenameKey] ?? '',
  )

  return (
    <div className="flex flex-col gap-4">
      <ToolIntro />

      {t.error && <Banner kind="error">{t.error}</Banner>}
      {t.notice && <Banner kind="info">{t.notice}</Banner>}

      <TemplateStep
        file={file}
        variables={variables}
        busy={t.busy === 'extract'}
        onFile={t.loadTemplate}
      />

      {variables.length > 0 && (
        <>
          <RowsStep
            rows={rows}
            variables={variables}
            importing={t.busy === 'import'}
            canAddRow={t.canAddRow}
            focusToken={t.state.templateVersion}
            dispatch={t.dispatch}
            onAddRow={t.addRow}
            onImport={t.importRows}
          />
          <OutputStep
            variables={variables}
            filenameKey={filenameKey}
            previewName={previewName}
            documentCount={documentCount}
            generating={t.busy === 'generate'}
            onKeyChange={(key) => t.dispatch({ type: 'filename-key-changed', key })}
            onGenerate={t.generate}
          />
        </>
      )}
    </div>
  )
}
