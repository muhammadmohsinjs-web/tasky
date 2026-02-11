import { describe, it, expect } from 'vitest'
import { MONTH_NAMES, STATUS_CONFIG, CATEGORY_PALETTE } from '../constants'

describe('MONTH_NAMES', () => {
  it('has exactly 12 months', () => {
    expect(MONTH_NAMES).toHaveLength(12)
  })

  it('starts with January and ends with December', () => {
    expect(MONTH_NAMES[0]).toBe('January')
    expect(MONTH_NAMES[11]).toBe('December')
  })
})

describe('STATUS_CONFIG', () => {
  it('has all three statuses defined', () => {
    expect(STATUS_CONFIG).toHaveProperty('todo')
    expect(STATUS_CONFIG).toHaveProperty('inprogress')
    expect(STATUS_CONFIG).toHaveProperty('done')
  })

  it.each(['todo', 'inprogress', 'done'] as const)('%s has all required fields', (status) => {
    const config = STATUS_CONFIG[status]
    expect(config).toHaveProperty('label')
    expect(config).toHaveProperty('color')
    expect(config).toHaveProperty('dot')
    expect(config).toHaveProperty('bg')
    expect(config).toHaveProperty('hex')
    expect(config.hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('has correct labels', () => {
    expect(STATUS_CONFIG.todo.label).toBe('To Do')
    expect(STATUS_CONFIG.inprogress.label).toBe('In Progress')
    expect(STATUS_CONFIG.done.label).toBe('Done')
  })
})

describe('CATEGORY_PALETTE', () => {
  it('has at least 1 color option', () => {
    expect(CATEGORY_PALETTE.length).toBeGreaterThan(0)
  })

  it.each(CATEGORY_PALETTE)('$name has all required fields', (palette) => {
    expect(palette).toHaveProperty('name')
    expect(palette).toHaveProperty('color')
    expect(palette).toHaveProperty('accent')
    expect(palette).toHaveProperty('hex')
    expect(palette.hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('has unique names', () => {
    const names = CATEGORY_PALETTE.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
