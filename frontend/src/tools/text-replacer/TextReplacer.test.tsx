import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/textReplacer'
import * as download from '../../lib/download'
import TextReplacer from './TextReplacer'

vi.mock('../../api/textReplacer')
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const template = new File(['x'], 'offer.docx')

async function uploadTemplate(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type=file]')!
  await userEvent.upload(input, template)
}

describe('TextReplacer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('walks through upload, editing a row and generating', async () => {
    vi.mocked(api.extractVariables).mockResolvedValue(['name', 'code'])
    vi.mocked(api.generateDocuments).mockResolvedValue({
      blob: new Blob(['doc']),
      filename: 'Budi_offer.docx',
    })
    const { container } = render(<TextReplacer />)

    await uploadTemplate(container)
    expect(
      await within(await screen.findByRole('list', { name: 'Detected variables' })).findByText(
        '{{name}}',
      ),
    ).toBeInTheDocument()

    expect(screen.getByLabelText('name, row 1')).toHaveFocus() // focus lands on first data cell
    await userEvent.type(screen.getByLabelText('name, row 1'), 'Budi')
    expect(screen.getByText('Budi_offer.docx')).toBeInTheDocument() // preview

    await userEvent.click(screen.getByRole('button', { name: 'Generate document' }))

    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.generateDocuments).toHaveBeenCalledWith(
      template,
      [{ name: 'Budi' }],
      'name',
      expect.any(AbortSignal),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Generated 1 document.')
  })

  it('disables generate until a row has data, and can add/remove rows', async () => {
    vi.mocked(api.extractVariables).mockResolvedValue(['name'])
    const { container } = render(<TextReplacer />)
    await uploadTemplate(container)
    await within(await screen.findByRole('list', { name: 'Detected variables' })).findByText(
      '{{name}}',
    )

    expect(screen.getByRole('button', { name: 'Generate document' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Add row' }))
    expect(screen.getByLabelText('name, row 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete row 2' }))
    expect(screen.queryByLabelText('name, row 2')).not.toBeInTheDocument()
  })

  it('copies a row next to its source', async () => {
    vi.mocked(api.extractVariables).mockResolvedValue(['name'])
    const { container } = render(<TextReplacer />)
    await uploadTemplate(container)
    await screen.findByLabelText('name, row 1')

    await userEvent.type(screen.getByLabelText('name, row 1'), 'Budi')
    await userEvent.click(screen.getByRole('button', { name: 'Copy row 1' }))

    expect(screen.getByLabelText('name, row 2')).toHaveValue('Budi')
    await userEvent.type(screen.getByLabelText('name, row 2'), ' Jr')
    expect(screen.getByLabelText('name, row 1')).toHaveValue('Budi')
  })

  it('shows server errors in an alert', async () => {
    vi.mocked(api.extractVariables).mockRejectedValue(new Error('File is not a valid .docx'))
    const { container } = render(<TextReplacer />)
    await uploadTemplate(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('File is not a valid .docx')
  })

  it('rejects wrong file types without calling the API', async () => {
    const { container } = render(<TextReplacer />)
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    await userEvent.upload(input, new File(['x'], 'notes.txt'), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
    expect(api.extractVariables).not.toHaveBeenCalled()
  })
})
