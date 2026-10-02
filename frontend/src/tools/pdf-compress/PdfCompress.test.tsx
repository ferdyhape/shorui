import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/pdfCompress'
import * as download from '../../lib/download'
import PdfCompress from './PdfCompress'

vi.mock('../../api/pdfCompress', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  compress: vi.fn(),
}))
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const file = new File(['x'], 'photo.pdf')

describe('PdfCompress', () => {
  beforeEach(() => vi.resetAllMocks())

  it('compresses with the default quality and reports the size reduction', async () => {
    vi.mocked(api.compress).mockResolvedValue({
      blob: new Blob(['x']),
      filename: 'photo-compressed.pdf',
      originalSize: 1000,
      compressedSize: 400,
    })
    const { container } = render(<PdfCompress />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByRole('button', { name: 'Compress PDF' }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.compress).toHaveBeenCalledWith(file, 50, expect.any(AbortSignal))
    expect(screen.getByRole('status')).toHaveTextContent('60% smaller')
  })

  it('sends a changed quality value', async () => {
    vi.mocked(api.compress).mockResolvedValue({
      blob: new Blob(['x']),
      filename: 'x.pdf',
      originalSize: 1,
      compressedSize: 1,
    })
    const { container } = render(<PdfCompress />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    const quality = screen.getByLabelText('Image quality')
    await userEvent.clear(quality)
    await userEvent.type(quality, '20')
    await userEvent.click(screen.getByRole('button', { name: 'Compress PDF' }))

    await waitFor(() =>
      expect(api.compress).toHaveBeenCalledWith(file, 20, expect.any(AbortSignal)),
    )
  })

  it('disables the button until a file is chosen', () => {
    render(<PdfCompress />)
    expect(screen.getByRole('button', { name: 'Compress PDF' })).toBeDisabled()
  })

  it('rejects a non-pdf file', async () => {
    const { container } = render(<PdfCompress />)
    await userEvent.upload(
      container.querySelector<HTMLInputElement>('input[type=file]')!,
      new File(['x'], 'notes.txt'),
      { applyAccept: false },
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
  })

  it('links to the sample PDF', () => {
    render(<PdfCompress />)
    expect(screen.getByRole('link', { name: /sample image-heavy pdf/i })).toHaveAttribute(
      'href',
      '/api/v1/pdf-compress/samples/sample-photo.pdf',
    )
  })
})
