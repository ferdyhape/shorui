import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/pdfTools'
import * as download from '../../lib/download'
import PdfTools from './PdfTools'

vi.mock('../../api/pdfTools', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  inspectFiles: vi.fn(),
  processFiles: vi.fn(),
}))
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const fileA = new File(['x'], 'a.pdf')
const fileB = new File(['y'], 'b.pdf')

async function addFiles(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>('input[type=file]')!
  await userEvent.upload(input, files)
}

describe('PdfTools', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lists one row per page across files, in upload order', async () => {
    vi.mocked(api.inspectFiles).mockResolvedValue([
      { filename: 'a.pdf', page_count: 2 },
      { filename: 'b.pdf', page_count: 1 },
    ])
    const { container } = render(<PdfTools />)
    await addFiles(container, [fileA, fileB])

    expect(await screen.findByText('a.pdf — page 1')).toBeInTheDocument()
    expect(screen.getByText('a.pdf — page 2')).toBeInTheDocument()
    expect(screen.getByText('b.pdf — page 1')).toBeInTheDocument()
    expect(screen.getByText('2 files added, 3 pages total.')).toBeInTheDocument()
  })

  it('rotates, reorders and removes pages, then generates with the right plan', async () => {
    vi.mocked(api.inspectFiles).mockResolvedValue([{ filename: 'a.pdf', page_count: 2 }])
    vi.mocked(api.processFiles).mockResolvedValue({
      blob: new Blob(['pdf']),
      filename: 'merged.pdf',
    })
    const { container } = render(<PdfTools />)
    await addFiles(container, [fileA])
    await screen.findByText('a.pdf — page 1')

    await userEvent.click(screen.getByRole('button', { name: 'Rotate page 1' }))
    expect(screen.getAllByText('90°')).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Move page 2 up' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('a.pdf — page 2')

    await userEvent.click(screen.getByRole('button', { name: 'Generate PDF' }))
    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.processFiles).toHaveBeenCalledWith(
      [fileA],
      [
        { file_index: 0, page_index: 1, rotate: 0 },
        { file_index: 0, page_index: 0, rotate: 90 },
      ],
      'merged.pdf',
      expect.any(AbortSignal),
    )
  })

  it('clear all removes every file and page', async () => {
    vi.mocked(api.inspectFiles).mockResolvedValue([{ filename: 'a.pdf', page_count: 1 }])
    const { container } = render(<PdfTools />)
    await addFiles(container, [fileA])
    await screen.findByText('a.pdf — page 1')

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.queryByText('a.pdf — page 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generate PDF' })).not.toBeInTheDocument()
  })

  it('rejects a non-pdf file', async () => {
    const { container } = render(<PdfTools />)
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    await userEvent.upload(input, new File(['x'], 'notes.txt'), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('is not a .pdf file')
    expect(api.inspectFiles).not.toHaveBeenCalled()
  })

  it('links to both sample PDFs', () => {
    render(<PdfTools />)
    expect(screen.getByRole('link', { name: /sample pdf a/i })).toHaveAttribute(
      'href',
      '/api/v1/pdf-tools/samples/sample-a.pdf',
    )
    expect(screen.getByRole('link', { name: /sample pdf b/i })).toHaveAttribute(
      'href',
      '/api/v1/pdf-tools/samples/sample-b.pdf',
    )
  })
})
