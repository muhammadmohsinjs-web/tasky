import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTaskModal } from '../AddTaskModal'

describe('AddTaskModal submit behavior', () => {
  it('keeps modal open when submit fails', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(false)

    render(
      <AddTaskModal
        isOpen
        mode="create"
        defaultDateISO="2026-02-20"
        task={null}
        categories={[]}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText('Title'), 'Failed Save Task')
    await user.click(screen.getByRole('button', { name: 'Create Task' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes modal when submit succeeds', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <AddTaskModal
        isOpen
        mode="create"
        defaultDateISO="2026-02-20"
        task={null}
        categories={[]}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText('Title'), 'Successful Save Task')
    await user.click(screen.getByRole('button', { name: 'Create Task' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('renders saved links as clickable anchors', () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn()

    render(
      <AddTaskModal
        isOpen
        mode="view"
        defaultDateISO="2026-02-20"
        task={{
          id: 'task-1',
          title: 'Task with link',
          category_id: null,
          date: '2026-02-20',
          status: 'todo',
          priority: 'medium',
          links: [{ url: 'https://example.com', label: 'Codex tutorial' }],
          attachments: [],
          created_at: '2026-02-20T00:00:00.000Z',
        }}
        categories={[]}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    const link = screen.getByRole('link', { name: 'Codex tutorial' })
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('submits habits with daily recurrence and no execution metadata', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <AddTaskModal
        isOpen
        mode="create"
        defaultDateISO="2026-02-20"
        defaultTaskType="habit"
        task={null}
        categories={[]}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText('Title'), 'Morning walk')
    await user.clear(screen.getByLabelText('Start time'))
    await user.type(screen.getByLabelText('Start time'), '08:00')
    await user.click(screen.getByRole('button', { name: 'Show' }))
    await user.type(screen.getByLabelText('End time (optional)'), '08:30')
    await user.click(screen.getByRole('button', { name: 'Create Habit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.task_type).toBe('habit')
    expect(payload.description).toBeNull()
    expect(payload.notes).toBeNull()
    expect(payload.links).toEqual([])
    expect(payload.files).toEqual([])
    expect(payload.end_time).toBe('08:30')
    expect(payload.recurrence).toEqual({ frequency: 'daily', interval: 1, end_date: null })
    expect(payload.subtasks).toEqual([])
    expect(payload.tags).toEqual([])
    expect(payload.reminderAt).toBeNull()
  })
})
