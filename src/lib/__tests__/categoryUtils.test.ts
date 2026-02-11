import { describe, it, expect } from 'vitest'
import { categoryStyle, categoryAccent, categoryDot, categoryLabel } from '../categoryUtils'
import type { Category } from '../../types'

const mockCategory: Category = {
  id: '1',
  name: 'Backend',
  slug: 'backend',
  color: 'bg-blue-100 text-blue-700',
  accent: 'border-l-blue-400',
  short_label: 'BE',
}

describe('categoryStyle', () => {
  it('returns category color when category is provided', () => {
    expect(categoryStyle(mockCategory)).toBe('bg-blue-100 text-blue-700')
  })

  it('returns default slate when category is null', () => {
    expect(categoryStyle(null)).toBe('bg-slate-100 text-slate-600')
  })

  it('returns default slate when category is undefined', () => {
    expect(categoryStyle(undefined)).toBe('bg-slate-100 text-slate-600')
  })
})

describe('categoryAccent', () => {
  it('returns category accent when category is provided', () => {
    expect(categoryAccent(mockCategory)).toBe('border-l-blue-400')
  })

  it('returns default slate when category is null', () => {
    expect(categoryAccent(null)).toBe('border-l-slate-300')
  })

  it('returns default slate when category is undefined', () => {
    expect(categoryAccent(undefined)).toBe('border-l-slate-300')
  })
})

describe('categoryDot', () => {
  it('converts accent border-l- to bg- prefix', () => {
    expect(categoryDot(mockCategory)).toBe('bg-blue-400')
  })

  it('returns default slate when category is null', () => {
    expect(categoryDot(null)).toBe('bg-slate-300')
  })

  it('returns default slate when category is undefined', () => {
    expect(categoryDot(undefined)).toBe('bg-slate-300')
  })

  it('handles different color accents correctly', () => {
    const violet: Category = { ...mockCategory, accent: 'border-l-violet-400' }
    expect(categoryDot(violet)).toBe('bg-violet-400')
  })
})

describe('categoryLabel', () => {
  it('returns short_label when category is provided', () => {
    expect(categoryLabel(mockCategory)).toBe('BE')
  })

  it('returns GEN when category is null', () => {
    expect(categoryLabel(null)).toBe('GEN')
  })

  it('returns GEN when category is undefined', () => {
    expect(categoryLabel(undefined)).toBe('GEN')
  })
})
