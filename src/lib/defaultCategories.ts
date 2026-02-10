import type { Category } from '../types'

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Backend',
    slug: 'backend',
    color: 'bg-blue-100 text-blue-700',
    accent: 'border-l-blue-400',
    short_label: 'BE',
  },
  {
    name: 'Cloud',
    slug: 'cloud',
    color: 'bg-amber-100 text-amber-700',
    accent: 'border-l-amber-400',
    short_label: 'AWS',
  },
  {
    name: 'Agentic AI',
    slug: 'agentic-ai',
    color: 'bg-violet-100 text-violet-700',
    accent: 'border-l-violet-400',
    short_label: 'AI',
  },
]
