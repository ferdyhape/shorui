import { useId, type InputHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  iconLeft?: IconName
  mono?: boolean
  containerClassName?: string
}

/** Text input with the same chrome (border, shadow, focus ring) as Select/Button. */
export function Input({
  label,
  hint,
  error,
  iconLeft,
  mono = false,
  id,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  ...rest
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={inputId} className="text-body-sm font-medium text-ink-muted">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      <div
        className={`flex h-[var(--control-height-md)] items-center gap-1.5 rounded-md border px-2.5 shadow-xs transition-colors duration-120 pointer-coarse:h-[var(--control-height-touch)] ${
          disabled ? 'bg-surface-sunken opacity-65' : 'bg-surface-card'
        } ${
          error
            ? 'border-red-500'
            : 'border-border hover:border-border-strong has-[:focus]:border-border-focus has-[:focus]:shadow-[var(--focus-ring)]'
        }`}
      >
        {iconLeft ? <Icon name={iconLeft} size={15} className="text-ink-faint" /> : null}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          className={`min-w-0 flex-1 border-none bg-transparent text-ink outline-none placeholder:text-ink-disabled ${
            mono
              ? 'font-mono text-body-sm tracking-[-0.01em]'
              : 'font-sans text-body tracking-[-0.004em]'
          } ${className}`}
          {...rest}
        />
      </div>
      {error || hint ? (
        <span className={`text-caption ${error ? 'text-red-700' : 'text-ink-faint'}`}>
          {error || hint}
        </span>
      ) : null}
    </div>
  )
}
