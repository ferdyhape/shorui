import { useState, type DragEvent, type ReactNode } from 'react'
import { Icon } from './core/Icon'

interface Props {
  accept: string
  disabled?: boolean
  onFiles: (files: File[]) => void
  children: ReactNode
}

/** Same look and keyboard/drag behaviour as FileDropzone, but accepts several files at once. */
export function MultiFileDropzone({ accept, disabled, onFiles, children }: Props) {
  const [dragging, setDragging] = useState(false)

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length && !disabled) onFiles(files)
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed px-6 py-7 text-center text-body-sm transition-colors duration-120 has-[:focus-visible]:border-brand has-[:focus-visible]:shadow-[var(--focus-ring)] ${
        dragging
          ? 'border-brand bg-surface-selected text-ink-brand'
          : 'border-border-strong text-ink-faint hover:border-brand hover:bg-surface-selected hover:text-ink-brand'
      } ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        multiple
        className="sr-only-focusable"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = '' // allow re-selecting the same file(s)
          if (files.length) onFiles(files)
        }}
      />
      <Icon name="upload" size={20} />
      <span>{children}</span>
    </label>
  )
}
