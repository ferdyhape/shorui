import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { INTRO_DISMISSED_KEY, ToolIntro } from './ToolIntro'

const HEADING = { name: 'What does this tool do?' }

describe('ToolIntro', () => {
  beforeEach(() => localStorage.clear())

  it('explains the tool and shows the worked example', () => {
    render(<ToolIntro />)
    expect(screen.getByRole('heading', HEADING)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Example' })).toHaveTextContent('Budi_letter.docx')
  })

  it('can be dismissed, stays dismissed after a reload, and can be reopened', async () => {
    const first = render(<ToolIntro />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss introduction' }))
    expect(screen.queryByRole('heading', HEADING)).not.toBeInTheDocument()
    expect(localStorage.getItem(INTRO_DISMISSED_KEY)).toBe('true')
    first.unmount()

    render(<ToolIntro />) // simulates a fresh page load
    expect(screen.queryByRole('heading', HEADING)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'What does this tool do?' }))
    expect(screen.getByRole('heading', HEADING)).toBeInTheDocument()
    expect(localStorage.getItem(INTRO_DISMISSED_KEY)).toBe('false')
  })
})
