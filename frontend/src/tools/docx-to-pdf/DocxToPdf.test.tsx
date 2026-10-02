import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/docxToPdf'
import * as download from '../../lib/download'
import DocxToPdf from './DocxToPdf'

vi.mock('../../api/docxToPdf')
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const file = new File(['x'], 'letter.docx')

describe('DocxToPdf', () => {
  beforeEach(() => vi.resetAllMocks())

  it('converts the chosen file and saves the result', async () => {
    vi.mocked(api.convertToPdf).mockResolvedValue({
      blob: new Blob(['pdf']),
      filename: 'letter.pdf',
    })
    const { container } = render(<DocxToPdf />)

    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.convertToPdf).toHaveBeenCalledWith(file, expect.any(AbortSignal))
    expect(screen.getByRole('status')).toHaveTextContent('Converted to letter.pdf.')
  })

  it('disables the button until a file is chosen', () => {
    render(<DocxToPdf />)
    expect(screen.getByRole('button', { name: 'Convert to PDF' })).toBeDisabled()
  })

  it('rejects non-.docx files', async () => {
    const { container } = render(<DocxToPdf />)
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    await userEvent.upload(input, new File(['x'], 'notes.txt'), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
    expect(api.convertToPdf).not.toHaveBeenCalled()
  })

  it('shows a server error', async () => {
    vi.mocked(api.convertToPdf).mockRejectedValue(new Error('LibreOffice is not installed'))
    const { container } = render(<DocxToPdf />)
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('LibreOffice is not installed')
  })

  it('links to the sample .docx', () => {
    render(<DocxToPdf />)
    expect(screen.getByRole('link', { name: /sample \.docx/i })).toHaveAttribute(
      'href',
      '/api/v1/docx-to-pdf/samples/sample.docx',
    )
  })
})
