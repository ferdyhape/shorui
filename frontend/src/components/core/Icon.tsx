import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileOutput,
  FileSearch,
  FileStack,
  FileText,
  Info,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Replace,
  RotateCw,
  Sun,
  Upload,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

// Import icons by name (not `import *`) so the build bundles only the ones listed here.
const ICONS = {
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  copy: Copy,
  download: Download,
  'file-output': FileOutput,
  'file-search': FileSearch,
  'file-stack': FileStack,
  'file-text': FileText,
  info: Info,
  menu: Menu,
  monitor: Monitor,
  moon: Moon,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  plus: Plus,
  replace: Replace,
  'rotate-cw': RotateCw,
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
