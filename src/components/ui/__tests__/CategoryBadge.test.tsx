import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryBadge } from '../CategoryBadge'
import type { Category } from '../../../types'

const mockCategory: Category = {
  id: '1',
  name: 'Backend',
  slug: 'backend',
  color: 'bg-blue-100 text-blue-700',
  accent: 'border-l-blue-400',
  short_label: 'BE',
}

describe('CategoryBadge', () => {
  it('renders the category short label', () => {
    render(<CategoryBadge category={mockCategory} />)
    expect(screen.getByText('BE')).toBeInTheDocument()
  })

  it('renders GEN when category is null', () => {
    render(<CategoryBadge category={null} />)
    expect(screen.getByText('GEN')).toBeInTheDocument()
  })

  it('renders GEN when category is undefined', () => {
    render(<CategoryBadge />)
    expect(screen.getByText('GEN')).toBeInTheDocument()
  })

  it('applies category color classes', () => {
    render(<CategoryBadge category={mockCategory} />)
    const badge = screen.getByText('BE')
    expect(badge.className).toContain('bg-blue-100')
    expect(badge.className).toContain('text-blue-700')
  })

  it('applies default color classes when no category', () => {
    render(<CategoryBadge category={null} />)
    const badge = screen.getByText('GEN')
    expect(badge.className).toContain('bg-slate-100')
    expect(badge.className).toContain('text-slate-600')
  })
})
