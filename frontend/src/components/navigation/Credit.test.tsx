import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Credit } from './Credit'

describe('Credit', () => {
  it('links to the developer safely in a new tab', () => {
    render(<Credit />)
    const link = screen.getByRole('link', { name: 'ferdyhape' })
    expect(link).toHaveAttribute('href', 'https://ferdyhape.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
