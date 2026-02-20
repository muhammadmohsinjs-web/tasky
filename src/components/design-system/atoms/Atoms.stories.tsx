import type { Meta, StoryObj } from '@storybook/react'
import { Bell, Plus } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Caption,
  Checkbox,
  Divider,
  Heading,
  IconButton,
  Input,
  Label,
  Link,
  Radio,
  Skeleton,
  Spinner,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from '.'

const meta = {
  title: 'Design System/Atoms/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => (
    <div className="space-y-8">
      <section className="space-y-3">
        <Heading>Typography</Heading>
        <Text>Body text preview for the design system.</Text>
        <Caption>Caption text preview.</Caption>
        <Link href="#">Inline link</Link>
      </section>

      <section className="space-y-3">
        <Heading>Buttons</Heading>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <IconButton icon={<Plus className="h-4 w-4" />} label="Add" />
          <Button isLoading>Loading</Button>
        </div>
      </section>

      <section className="space-y-3">
        <Heading>Inputs</Heading>
        <div className="max-w-md space-y-3">
          <div className="space-y-1">
            <Label htmlFor="input-demo">Input</Label>
            <Input id="input-demo" placeholder="Type here" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="textarea-demo">Textarea</Label>
            <Textarea id="textarea-demo" placeholder="Long text" />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox aria-label="Checkbox" />
            <Radio name="radio-demo" aria-label="Radio" />
            <Switch label="Switch" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Heading>Display</Heading>
        <div className="flex items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge variant="success">Success</Badge>
          <Avatar fallback="MM" />
          <Tooltip tooltipContent="Notifications">
            <span>
              <IconButton icon={<Bell className="h-4 w-4" />} label="Notifications" />
            </span>
          </Tooltip>
          <Spinner />
        </div>
        <Divider />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </section>
    </div>
  ),
}
