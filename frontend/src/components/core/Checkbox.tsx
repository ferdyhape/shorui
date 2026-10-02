import { useId, type InputHTMLAttributes } from 'react'
import { Icon } from './Icon'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string
  hint?: string
}

/** A styled checkbox with its own clickable label; `checked`/`onChange` pass straight through.
 * `hint` is wired as an `aria-describedby`, not folded into the label, so the accessible name
 * stays just `label` (otherwise `getByLabelText('Document properties')` would need the hint
 * text too, and a screen reader would read the description as part of the name every time). */
export function Checkbox({ label, hint, id, className = '', ...rest }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex items-start gap-2">
      <div className="relative mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center">
        <input
          id={inputId}
          type="checkbox"
          aria-describedby={hintId}
          className={`peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface-card transition-colors duration-120 checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${className}`}
          {...rest}
        />
        <Icon
          name="check"
          size={13}
          className="pointer-events-none absolute text-ink-inverse opacity-0 peer-checked:opacity-100"
        />
      </div>
      <div>
        <label htmlFor={inputId} className="cursor-pointer text-body-sm text-ink select-none">
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="block text-caption text-ink-faint">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  )
}
