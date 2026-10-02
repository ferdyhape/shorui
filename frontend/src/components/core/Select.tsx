import { useId, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'

interface Option {
  value: string
  label: string
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  hint?: string
  options: Option[]
  containerClassName?: string
}

/** Native <select> with the same chrome (border, shadow, focus ring) as Kagami's Input. */
export function Select({
  label,
  hint,
  options,
  id,
  className = '',
  containerClassName = '',
  ...rest
}: Props) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={selectId} className="text-body-sm font-medium text-ink-muted">
          {label}
        </label>
      ) : null}
      <div className="relative flex h-[var(--control-height-md)] pointer-coarse:h-[var(--control-height-touch)] items-center rounded-md border border-border bg-surface-card shadow-xs transition-colors duration-120 hover:border-border-strong has-[:focus]:border-border-focus has-[:focus]:shadow-[var(--focus-ring)]">
        <select
          id={selectId}
          className={`min-w-0 flex-1 cursor-pointer appearance-none border-none bg-transparent px-2.5 pr-7 font-sans text-body-sm text-ink outline-none ${className}`}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={14}
          className="pointer-events-none absolute right-2.5 text-ink-faint"
        />
      </div>
      {hint ? <span className="text-caption text-ink-faint">{hint}</span> : null}
    </div>
  )
}
