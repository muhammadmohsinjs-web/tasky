import type { Meta, StoryObj } from '@storybook/react'
import { Plus, ArrowRight } from 'lucide-react'
import { Button } from './Button'

const meta = {
  title: 'Design System/Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Create task',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual intent style.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Controls height and horizontal spacing.',
    },
    state: {
      control: 'select',
      options: ['default', 'loading', 'error'],
      description: 'Applies non-disabled visual state treatment.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows spinner and disables interactions.',
    },
    disabled: {
      control: 'boolean',
      description: 'Native disabled state.',
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete task',
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Saving',
  },
}

export const WithIcons: Story = {
  args: {
    leftIcon: <Plus className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'New item',
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Add task',
    children: <Plus className="h-4 w-4" />,
  },
}
