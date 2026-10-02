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
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, reorder, rotate and drop pages from one or more PDFs.',
    icon: 'file-stack',
    component: lazy(() => import('./tools/pdf-tools/PdfTools')),
  },
  {
    id: 'docx-to-pdf',
    name: 'Docx to PDF',
    description: 'Convert a Word document to a PDF, laid out exactly like Word would print it.',
    icon: 'file-output',
    component: lazy(() => import('./tools/docx-to-pdf/DocxToPdf')),
  },
  {
    id: 'bulk-replace',
    name: 'Bulk Find & Replace',
    description: 'Apply the same find/replace pairs across many Word documents at once.',
    icon: 'file-search',
    component: lazy(() => import('./tools/bulk-replace/BulkReplace')),
  },
]
