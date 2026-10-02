export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-caption gap-1.5 pointer-coarse:h-[var(--control-height-touch)]',
  md: 'h-[var(--control-height-md)] px-3 text-body-sm gap-1.5 pointer-coarse:h-[var(--control-height-touch)]',
  lg: 'h-10 px-4 text-body-sm gap-2 pointer-coarse:h-[var(--control-height-touch)]',
}
export const ICON_SIZES: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 16 }

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-ink-inverse border border-transparent shadow-xs hover:bg-brand-hover active:bg-brand-active active:shadow-none',
  secondary:
    'bg-surface-card text-ink border border-border shadow-xs hover:bg-surface-hover-subtle hover:border-border-strong active:bg-surface-hover active:shadow-none',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  danger:
    'bg-red-500 text-ink-inverse border border-transparent shadow-xs hover:bg-red-700 active:bg-red-700 active:shadow-none',
}

/** Class string shared by <Button> and anchors that must look like buttons. */
export function buttonClasses(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') {
  return `focus-ring inline-flex items-center justify-center rounded-md font-sans font-medium leading-none tracking-[-0.004em] whitespace-nowrap no-underline transition-colors duration-120 ${SIZES[size]} ${VARIANTS[variant]}`
}
