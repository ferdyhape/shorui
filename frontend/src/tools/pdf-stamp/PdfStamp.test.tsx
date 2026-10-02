import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/pdfStamp'
import * as download from '../../lib/download'
import PdfStamp from './PdfStamp'

vi.mock('../../api/pdfStamp')
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const file = new File(['x'], 'report.pdf')

describe('PdfStamp', () => {
  beforeEach(() => vi.resetAllMocks())

  it('stamps with page numbers on by default', async () => {
    vi.mocked(api.stamp).mockResolvedValue({
      blob: new Blob(['x']),
      filename: 'report-stamped.pdf',
    })
    const { container } = render(<PdfStamp />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.type(screen.getByLabelText('Watermark text'), 'DRAFT')
    await userEvent.click(screen.getByRole('button', { name: 'Stamp PDF' }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.stamp).toHaveBeenCalledWith(
      file,
      { watermarkText: 'DRAFT', pageNumbers: true },
      expect.any(AbortSignal),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Generated report-stamped.pdf.')
  })

  it('page numbers alone is enough to stamp', async () => {
    vi.mocked(api.stamp).mockResolvedValue({ blob: new Blob(['x']), filename: 'x.pdf' })
    const { container } = render(<PdfStamp />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByRole('button', { name: 'Stamp PDF' }))
    await waitFor(() => expect(api.stamp).toHaveBeenCalled())
  })

  it('blocks stamping with no watermark text and page numbers off', async () => {
    const { container } = render(<PdfStamp />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByLabelText('Add page numbers'))
    await userEvent.click(screen.getByRole('button', { name: 'Stamp PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter watermark text')
    expect(api.stamp).not.toHaveBeenCalled()
  })

  it('rejects a non-pdf file', async () => {
    const { container } = render(<PdfStamp />)
    await userEvent.upload(
      container.querySelector<HTMLInputElement>('input[type=file]')!,
      new File(['x'], 'notes.txt'),
      { applyAccept: false },
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
  })
})
