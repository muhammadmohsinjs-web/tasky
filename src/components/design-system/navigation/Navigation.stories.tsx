import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  CommandPalette,
  ContextMenu,
  MobileBottomNavigation,
  Navbar,
  Sidebar,
  SidebarItem,
  TopHeaderBar,
} from '..'

const meta = {
  title: 'Design System/Navigation/Overview',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function NavigationPreview() {
  const [openPalette, setOpenPalette] = useState(false)
  const [mobile, setMobile] = useState('home')

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <Navbar
        brand={<span className="font-semibold">Tasky UI</span>}
        actions={<button type="button" onClick={() => setOpenPalette(true)} className="rounded border px-2 py-1 text-sm">Commands</button>}
      />

      <div className="flex">
        <Sidebar header={<span className="text-sm font-semibold">Workspace</span>}>
          <SidebarItem href="#" active>Dashboard</SidebarItem>
          <SidebarItem href="#">Tasks</SidebarItem>
          <SidebarItem href="#">Analytics</SidebarItem>
        </Sidebar>

        <main className="flex-1 p-4">
          <TopHeaderBar title="Navigation Components" subtitle="Reusable nav blocks" />
          <ContextMenu
            trigger={<span className="rounded border px-2 py-1 text-sm">Open context menu</span>}
            items={[{ label: 'Duplicate', onSelect: () => {} }, { label: 'Archive', onSelect: () => {} }]}
          />
        </main>
      </div>

      <MobileBottomNavigation
        items={[
          { value: 'home', label: 'Home' },
          { value: 'tasks', label: 'Tasks' },
          { value: 'stats', label: 'Stats' },
          { value: 'profile', label: 'Profile' },
        ]}
        value={mobile}
        onChange={setMobile}
      />

      <CommandPalette
        open={openPalette}
        onClose={() => setOpenPalette(false)}
        items={[
          { id: '1', label: 'Go to Tasks', onSelect: () => {} },
          { id: '2', label: 'Create Task', onSelect: () => {} },
        ]}
      />
    </div>
  )
}

export const Overview: Story = {
  render: () => <NavigationPreview />,
}
