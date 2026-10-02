import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/bulkReplace'
import * as download from '../../lib/download'
import BulkReplace from './BulkReplace'

vi.mock('../../api/bulkReplace', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  processFiles: vi.fn(),
}))
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const fileA = new File(['x'], 'a.docx')

function fileInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[type=file]')!
}

describe('BulkReplace', () => {
  beforeEach(() => vi.resetAllMocks())

  it('runs the configured pairs against the uploaded files', async () => {
    vi.mocked(api.processFiles).mockResolvedValue({
      blob: new Blob(['zip']),
      filename: 'bulk-replace.zip',
    })
    const { container } = render(<BulkReplace />)

    await userEvent.upload(fileInput(container), fileA)
    expect(screen.getByText('a.docx')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Find, row 1'), 'Acme')
    await userEvent.type(screen.getByLabelText('Replace with, row 1'), 'Globex')
    await userEvent.click(screen.getByRole('button', { name: /replace and download/i }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.processFiles).toHaveBeenCalledWith(
      [fileA],
      [['Acme', 'Globex']],
      expect.any(AbortSignal),
    )
  })

  it('blocks generating without a file or a pair', async () => {
    render(<BulkReplace />)
    await userEvent.click(screen.getByRole('button', { name: /replace and download/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Add at least one .docx file')
  })

  it('adds and removes rows', async () => {
    render(<BulkReplace />)
    await userEvent.click(screen.getByRole('button', { name: 'Add row' }))
    expect(screen.getByLabelText('Find, row 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete row 2' }))
    expect(screen.queryByLabelText('Find, row 2')).not.toBeInTheDocument()
  })

  it('removes an uploaded file', async () => {
    const { container } = render(<BulkReplace />)
    await userEvent.upload(fileInput(container), fileA)
    await userEvent.click(screen.getByRole('button', { name: 'Remove a.docx' }))
    expect(screen.queryByText('a.docx')).not.toBeInTheDocument()
  })

  it('rejects a non-docx file', async () => {
    const { container } = render(<BulkReplace />)
    await userEvent.upload(fileInput(container), new File(['x'], 'notes.txt'), {
      applyAccept: false,
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('is not a .docx file')
  })

  it('links to both sample letters', () => {
    render(<BulkReplace />)
    expect(screen.getByRole('link', { name: /sample letter 1/i })).toHaveAttribute(
      'href',
      '/api/v1/bulk-replace/samples/letter-budi.docx',
    )
    expect(screen.getByRole('link', { name: /sample letter 2/i })).toHaveAttribute(
      'href',
      '/api/v1/bulk-replace/samples/letter-sari.docx',
    )
  })
})
