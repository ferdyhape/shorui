import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileText,
  Info,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Replace,
  Sun,
  Upload,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

// Import icons by name (not `import *`) so the build bundles only the ones listed here.
const ICONS = {
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  copy: Copy,
  download: Download,
  'file-text': FileText,
  info: Info,
  monitor: Monitor,
  moon: Moon,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  plus: Plus,
  replace: Replace,
  sun: Sun,
  upload: Upload,
  x: X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

interface Props extends Omit<LucideProps, 'ref'> {
  name: IconName
  title?: string
}

export function Icon({ name, size = 16, className = '', title, ...rest }: Props) {
  const Component = ICONS[name]
  return (
    <Component
      size={size}
      strokeWidth={1.75}
      className={`shrink-0 ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    />
  )
}
