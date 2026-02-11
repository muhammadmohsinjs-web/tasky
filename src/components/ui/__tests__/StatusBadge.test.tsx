import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusBadge, nextStatus } from '../StatusBadge'

describe('nextStatus', () => {
  it('cycles todo → inprogress', () => {
    expect(nextStatus('todo')).toBe('inprogress')
  })

  it('cycles inprogress → done', () => {
    expect(nextStatus('inprogress')).toBe('done')
  })

  it('cycles done → todo', () => {
    expect(nextStatus('done')).toBe('todo')
  })
})

describe('StatusBadge', () => {
  it('renders the correct label for todo', () => {
    render(<StatusBadge status="todo" />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('renders the correct label for inprogress', () => {
    render(<StatusBadge status="inprogress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders the correct label for done', () => {
    render(<StatusBadge status="done" />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<StatusBadge status="todo" onClick={handleClick} />)
    await user.click(screen.getByText('To Do'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not have cursor-pointer class without onClick', () => {
    render(<StatusBadge status="todo" />)
    const badge = screen.getByText('To Do').closest('span')
    expect(badge?.className).not.toContain('cursor-pointer')
  })
})
