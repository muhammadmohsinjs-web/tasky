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
})
