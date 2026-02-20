import type { Meta, StoryObj } from '@storybook/react'
import {
  Container,
  Grid,
  PageWrapper,
  ResizablePanel,
  ScrollArea,
  SectionWrapper,
  SplitViewLayout,
  Stack,
} from '..'

const meta = {
  title: 'Design System/Layout/Overview',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => (
    <PageWrapper>
      <Container>
        <Stack gap={2}>
          <SectionWrapper>Section wrapper</SectionWrapper>

          <Grid columns={3}>
            <SectionWrapper>A</SectionWrapper>
            <SectionWrapper>B</SectionWrapper>
            <SectionWrapper>C</SectionWrapper>
          </Grid>

          <SplitViewLayout
            primary={<SectionWrapper>Primary content</SectionWrapper>}
            secondary={<SectionWrapper>Secondary panel</SectionWrapper>}
          />

          <ResizablePanel>
            <p className="text-sm">Drag the bottom edge to resize this panel.</p>
          </ResizablePanel>

          <ScrollArea maxHeight={120} className="rounded border bg-white p-3">
            <div className="space-y-2 text-sm">
              {Array.from({ length: 12 }).map((_, idx) => (
                <p key={idx}>Scrollable line {idx + 1}</p>
              ))}
            </div>
          </ScrollArea>
        </Stack>
      </Container>
    </PageWrapper>
  ),
}
