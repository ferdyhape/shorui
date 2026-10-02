import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/docxCleaner'
import * as download from '../../lib/download'
import DocxCleaner from './DocxCleaner'

vi.mock('../../api/docxCleaner', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  clean: vi.fn(),
}))
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const file = new File(['x'], 'report.docx')

describe('DocxCleaner', () => {
  beforeEach(() => vi.resetAllMocks())

  it('cleans with all three options on by default', async () => {
    vi.mocked(api.clean).mockResolvedValue({
      blob: new Blob(['x']),
      filename: 'report-cleaned.docx',
    })
    const { container } = render(<DocxCleaner />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByRole('button', { name: 'Clean document' }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.clean).toHaveBeenCalledWith(
      file,
      { stripProperties: true, stripComments: true, acceptRevisions: true },
      expect.any(AbortSignal),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Cleaned report-cleaned.docx.')
  })

  it('toggling an option off is reflected in the next call', async () => {
    vi.mocked(api.clean).mockResolvedValue({ blob: new Blob(['x']), filename: 'x.docx' })
    const { container } = render(<DocxCleaner />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByLabelText('Reviewer comments'))
    await userEvent.click(screen.getByRole('button', { name: 'Clean document' }))

    await waitFor(() => expect(api.clean).toHaveBeenCalled())
    expect(api.clean).toHaveBeenCalledWith(
      file,
      { stripProperties: true, stripComments: false, acceptRevisions: true },
      expect.any(AbortSignal),
    )
  })

  it('blocks cleaning when every option is off', async () => {
    const { container } = render(<DocxCleaner />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    for (const label of ['Document properties', 'Reviewer comments', 'Tracked changes']) {
      await userEvent.click(screen.getByLabelText(label))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Clean document' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Select at least one')
    expect(api.clean).not.toHaveBeenCalled()
  })

  it('rejects a non-docx file', async () => {
    const { container } = render(<DocxCleaner />)
    await userEvent.upload(
      container.querySelector<HTMLInputElement>('input[type=file]')!,
      new File(['x'], 'notes.txt'),
      { applyAccept: false },
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
  })

  it('links to the sample .docx', () => {
    render(<DocxCleaner />)
    expect(screen.getByRole('link', { name: /sample \.docx/i })).toHaveAttribute(
      'href',
      '/api/v1/docx-cleaner/samples/sample.docx',
    )
  })
})
