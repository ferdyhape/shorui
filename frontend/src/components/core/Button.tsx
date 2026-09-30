import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, ICON_SIZES, type ButtonSize, type ButtonVariant } from './buttonStyles'
import { Icon, type IconName } from './Icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: IconName
  iconRight?: IconName
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}: Props) {
  const off = disabled || loading
  const iconSize = ICON_SIZES[size]
  return (
    <button
      type={type}
      disabled={off}
      className={`${buttonClasses(variant, size)} ${
        off ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="animate-spin rounded-full border-[1.5px] border-current opacity-90"
          style={{ width: iconSize - 2, height: iconSize - 2, borderTopColor: 'transparent' }}
        />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} />
      ) : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  )
}
