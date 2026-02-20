import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  ActivityFeed,
  Carousel,
  DragDropWrapper,
  ExpandablePanel,
  HoverCard,
  InfiniteScroll,
  MentionInput,
} from '..'

const meta = {
  title: 'Design System/Advanced/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function AdvancedPreview() {
  const [mentionText, setMentionText] = useState('Hello @')

  return (
    <div className="space-y-6">
      <Carousel slides={[<div key="1">Slide 1</div>, <div key="2">Slide 2</div>]} />

      <DragDropWrapper>
        <p className="text-sm">Drop files here</p>
      </DragDropWrapper>

      <HoverCard trigger={<span className="rounded border px-2 py-1 text-sm">Hover me</span>} content="Hover card content" />

      <ExpandablePanel title="Expandable panel" defaultOpen>
        Expanded content
      </ExpandablePanel>

      <ActivityFeed
        items={[
          { id: '1', actor: 'Mohsin', action: 'created', target: 'Task #24', timestamp: '2m ago' },
          { id: '2', actor: 'Sara', action: 'completed', target: 'Task #12', timestamp: '9m ago' },
        ]}
      />

      <MentionInput
        mentions={['mohsin', 'sara', 'alex']}
        value={mentionText}
        onValueChange={setMentionText}
        placeholder="Type @ to mention"
      />

      <InfiniteScroll hasMore={false} loading={false} onLoadMore={() => {}}>
        <div className="rounded border bg-white p-3 text-sm">Infinite scroll container</div>
      </InfiniteScroll>
    </div>
  )
}

export const Overview: Story = {
  render: () => <AdvancedPreview />,
}
