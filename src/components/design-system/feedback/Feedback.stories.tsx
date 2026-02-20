import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Alert,
  Button,
  ConfirmationDialog,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingOverlay,
  Modal,
  Popover,
  ProgressBar,
  Stepper,
  SuccessState,
} from '..'

const meta = {
  title: 'Design System/Feedback/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function FeedbackPreview() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setModal(true)}>Open Modal</Button>
        <Button variant="secondary" onClick={() => setDrawer(true)}>Open Drawer</Button>
        <Button variant="destructive" onClick={() => setConfirm(true)}>Open Confirm</Button>
        <Popover trigger={<span className="rounded border px-2 py-1 text-sm">Open Popover</span>}>
          Popover content
        </Popover>
      </div>

      <Alert title="Info">Informational alert.</Alert>
      <SuccessState message="Saved successfully." />
      <ErrorState message="Could not load resource." />
      <EmptyState title="No data yet" description="Create your first item to get started." />
      <ProgressBar value={64} />
      <Stepper steps={['Plan', 'Build', 'Ship']} currentStep={1} />

      <LoadingOverlay loading={false}>
        <div className="rounded border p-3">Content area with optional overlay</div>
      </LoadingOverlay>

      <Modal open={modal} title="Modal" description="Reusable modal" onClose={() => setModal(false)}>
        Modal content
      </Modal>

      <Drawer open={drawer} title="Drawer" onClose={() => setDrawer(false)}>
        Drawer content
      </Drawer>

      <ConfirmationDialog
        open={confirm}
        title="Delete item"
        description="This action cannot be undone"
        onCancel={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
      />
    </div>
  )
}

export const Overview: Story = {
  render: () => <FeedbackPreview />,
}
