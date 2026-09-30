import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconName } from './components/core/Icon'

export interface Tool {
  id: string // also the route: /#/<id>
  name: string
  description: string
  icon: IconName
  component: LazyExoticComponent<ComponentType>
}

// Register new tools here; the sidebar and routes pick them up. Each tool is code-split.
export const tools: Tool[] = [
  {
    id: 'text-replacer',
    name: 'Text Replacer',
    description: 'Generate many documents from one Word template. One document per row of data.',
    icon: 'replace',
    component: lazy(() => import('./tools/text-replacer/TextReplacer')),
  },
]
