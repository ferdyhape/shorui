import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TemplateGuide } from './TemplateGuide'

describe('TemplateGuide', () => {
  it('links to the sample template and sample data', () => {
    render(<TemplateGuide />)
    expect(screen.getByRole('link', { name: /sample template/i })).toHaveAttribute(
      'href',
      '/api/v1/text-replacer/samples/template.docx',
    )
    expect(screen.getByRole('link', { name: /sample data/i })).toHaveAttribute(
      'href',
      '/api/v1/text-replacer/samples/data.csv',
    )
  })
})
