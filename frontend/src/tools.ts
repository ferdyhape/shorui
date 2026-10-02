import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconName } from './components/core/Icon'

export type ToolCategory = 'docx' | 'pdf'

export interface Tool {
  id: string // also the route: /#/<id>
  name: string
  description: string
  icon: IconName
  category: ToolCategory // groups the sidebar: "Word Documents" vs "PDF"
  /** Set to `false` to exclude a tool from the desktop build (see `visibleTools`). Omitted = true. */
  desktop?: boolean
  component: LazyExoticComponent<ComponentType>
}

// Register new tools here; the sidebar and routes pick them up. Each tool is code-split.
export const tools: Tool[] = [
  {
    id: 'text-replacer',
    name: 'Text Replacer',
    description: 'Generate many documents from one Word template. One document per row of data.',
    icon: 'replace',
    category: 'docx',
    component: lazy(() => import('./tools/text-replacer/TextReplacer')),
  },
  {
    id: 'bulk-replace',
    name: 'Bulk Find & Replace',
    description: 'Apply the same find/replace pairs across many Word documents at once.',
    icon: 'file-search',
    category: 'docx',
    component: lazy(() => import('./tools/bulk-replace/BulkReplace')),
  },
  {
    id: 'docx-cleaner',
    name: 'Docx Cleaner',
    description: 'Strip author metadata, comments and tracked changes before sharing a .docx.',
    icon: 'eraser',
    category: 'docx',
    component: lazy(() => import('./tools/docx-cleaner/DocxCleaner')),
  },
  {
    id: 'docx-to-pdf',
    name: 'Docx to PDF',
    description: 'Convert a Word document to a PDF, laid out exactly like Word would print it.',
    icon: 'file-output',
    category: 'docx',
    // Needs LibreOffice installed (~300-500MB) - not worth bundling into the desktop installer
    // for one tool. Reversible: flip this back to omitted/true if that changes.
    desktop: false,
    component: lazy(() => import('./tools/docx-to-pdf/DocxToPdf')),
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, reorder, rotate and drop pages from one or more PDFs.',
    icon: 'file-stack',
    category: 'pdf',
    component: lazy(() => import('./tools/pdf-tools/PdfTools')),
  },
  {
    id: 'pdf-compress',
    name: 'PDF Compress',
    description: "Shrink a PDF's file size by recompressing its content and embedded images.",
    icon: 'minimize-2',
    category: 'pdf',
    component: lazy(() => import('./tools/pdf-compress/PdfCompress')),
  },
  {
    id: 'pdf-stamp',
    name: 'PDF Stamp',
    description: 'Add a watermark and/or page numbers to every page of a PDF.',
    icon: 'stamp',
    category: 'pdf',
    component: lazy(() => import('./tools/pdf-stamp/PdfStamp')),
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine one or more images into a single PDF, one image per page.',
    icon: 'image',
    category: 'pdf',
    component: lazy(() => import('./tools/image-to-pdf/ImageToPdf')),
  },
]

/** Pure so it's testable without faking `import.meta.env`; `visibleTools` below is the real call. */
export function computeVisibleTools(allTools: Tool[], isDesktopBuild: boolean): Tool[] {
  return isDesktopBuild ? allTools.filter((t) => t.desktop !== false) : allTools
}

// `desktop/scripts/sync.sh` builds the frontend with VITE_TARGET=desktop; the web build (dev or
// `npm run build`) never sets it, so this is a no-op there - `tools` and `visibleTools` are the
// same array for web.
export const visibleTools: Tool[] = computeVisibleTools(
  tools,
  import.meta.env.VITE_TARGET === 'desktop',
)
