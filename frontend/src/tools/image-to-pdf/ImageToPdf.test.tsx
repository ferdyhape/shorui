import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/imageToPdf'
import * as download from '../../lib/download'
import ImageToPdf from './ImageToPdf'

vi.mock('../../api/imageToPdf', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  build: vi.fn(),
}))
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof download>()),
  saveBlob: vi.fn(),
}))

const fileA = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
const fileB = new File(['y'], 'b.png', { type: 'image/png' })

function fileInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[type=file]')!
}

describe('ImageToPdf', () => {
  beforeEach(() => vi.resetAllMocks())

  it('builds a PDF from the added images in order', async () => {
    vi.mocked(api.build).mockResolvedValue({ blob: new Blob(['x']), filename: 'images.pdf' })
    const { container } = render(<ImageToPdf />)
    await userEvent.upload(fileInput(container), [fileA, fileB])
    expect(screen.getByText('a.jpg')).toBeInTheDocument()
    expect(screen.getByText('b.png')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Generate PDF' }))
    await waitFor(() => expect(download.saveBlob).toHaveBeenCalled())
    expect(api.build).toHaveBeenCalledWith([fileA, fileB], 'images.pdf', expect.any(AbortSignal))
  })

  it('removes an added image', async () => {
    const { container } = render(<ImageToPdf />)
    await userEvent.upload(fileInput(container), fileA)
    await userEvent.click(screen.getByRole('button', { name: 'Remove a.jpg' }))
    expect(screen.queryByText('a.jpg')).not.toBeInTheDocument()
  })

  it('blocks generating with no images', async () => {
    render(<ImageToPdf />)
    await userEvent.click(screen.getByRole('button', { name: 'Generate PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Add at least one image')
  })

  it('links to both sample photos', () => {
    render(<ImageToPdf />)
    expect(screen.getByRole('link', { name: /sample photo 1/i })).toHaveAttribute(
      'href',
      '/api/v1/image-to-pdf/samples/sample-1.jpg',
    )
    expect(screen.getByRole('link', { name: /sample photo 2/i })).toHaveAttribute(
      'href',
      '/api/v1/image-to-pdf/samples/sample-2.jpg',
    )
  })
})
