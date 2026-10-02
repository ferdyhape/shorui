import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { setViewport } from './test/viewport'

describe('App shell (responsive)', () => {
  beforeEach(() => localStorage.clear())

  it('starts with the navigation drawer closed on a phone and opens it from the top bar', async () => {
    setViewport('mobile')
    render(<App />)
    const toggle = screen.getByRole('button', { name: 'Open navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Close navigation' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the drawer when a tool is chosen', async () => {
    setViewport('mobile')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    await userEvent.click(screen.getByRole('button', { name: 'Text Replacer' }))
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('always shows the full sidebar in the drawer, even if it was collapsed on desktop', () => {
    localStorage.setItem('shorui:sidebarCollapsed', 'true')
    setViewport('mobile')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Text Replacer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hide sidebar' })).not.toBeInTheDocument()
  })

  it('offers the collapse control on desktop', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Hide sidebar' })).toBeInTheDocument()
  })

  it('groups the sidebar into Word Documents and PDF sections', () => {
    render(<App />)
    expect(screen.getByText('Word Documents')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    // Docx to PDF is grouped with the Word-document tools (it starts from a .docx).
    const wordSection = screen.getByText('Word Documents').parentElement!
    expect(wordSection).toHaveTextContent('Docx to PDF')
    expect(wordSection).not.toHaveTextContent('PDF Compress')
  })
})
