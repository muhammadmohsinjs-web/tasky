import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Accordion,
  Breadcrumb,
  CalendarCell,
  Card,
  DataGrid,
  DropdownMenu,
  KanbanCard,
  KanbanColumn,
  ListItem,
  Pagination,
  StatCard,
  Table,
  Tabs,
  TagChip,
  Timeline,
} from '..'

const meta = {
  title: 'Design System/Data Display/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type Row = {
  name: string
  status: string
}

const rows: Row[] = [
  { name: 'Build UI', status: 'Done' },
  { name: 'Add tests', status: 'In progress' },
]

function DataDisplayPreview() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '#' }, { label: 'Tasks' }, { label: 'Board' }]} />

      <DataGrid columns={3}>
        <Card title="Card">Card body</Card>
        <StatCard label="Completed" value="42" delta="+12%" />
        <CalendarCell dateLabel="20" isToday>Today tasks</CalendarCell>
      </DataGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Overview', value: 'overview' },
          { label: 'Details', value: 'details' },
        ]}
      />

      <Table<Row>
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'status', header: 'Status' },
        ]}
        rows={rows}
        rowKey={(row) => row.name}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KanbanColumn title="Todo" count={2}>
          <KanbanCard title="Plan sprint" />
          <KanbanCard title="Write docs" />
        </KanbanColumn>
        <KanbanColumn title="Doing" count={1}>
          <KanbanCard title="Build components" />
        </KanbanColumn>
        <KanbanColumn title="Done" count={1}>
          <KanbanCard title="Setup tokens" />
        </KanbanColumn>
      </div>

      <ul className="space-y-2">
        <ListItem title="List item" subtitle="Supporting text" />
      </ul>

      <DropdownMenu
        trigger={<span className="rounded border px-2 py-1 text-sm">Open menu</span>}
        items={[{ label: 'Edit', onSelect: () => {} }, { label: 'Delete', onSelect: () => {} }]}
      />

      <div className="flex gap-2">
        <TagChip>Default</TagChip>
        <TagChip active>Active</TagChip>
      </div>

      <Timeline items={[{ id: '1', title: 'Task created', timestamp: '10:00 AM' }]} />

      <Pagination page={1} totalPages={4} onPageChange={() => {}} />

      <Accordion items={[{ id: 'a1', title: 'Accordion item', content: 'Accordion content' }]} />
    </div>
  )
}

export const Overview: Story = {
  render: () => <DataDisplayPreview />,
}
