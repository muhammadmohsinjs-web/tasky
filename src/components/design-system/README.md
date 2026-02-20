# Design System

Atomic structure:

- `atoms/`: smallest UI primitives.
- `molecules/`: composed controls built from atoms.
- `organisms/`: larger feature sections.
- `layout/`: page and section layout primitives.
- `hooks/`: reusable UI hooks.
- `utils/`: shared style and variant helpers.

## Button (Atom)

File: `src/components/design-system/atoms/Button.tsx`

### Props

- `variant`: `'primary' | 'secondary' | 'ghost' | 'destructive'`
- `size`: `'sm' | 'md' | 'lg' | 'icon'`
- `state`: `'default' | 'loading' | 'error'`
- `isLoading`: boolean loading flag that disables interactions
- `leftIcon` / `rightIcon`: optional icon nodes
- supports native button props and `forwardRef`

### Usage

```tsx
import { Button } from '@/components/design-system'
import { Plus } from 'lucide-react'

export function Example() {
  return (
    <Button
      variant="primary"
      size="md"
      leftIcon={<Plus className="h-4 w-4" />}
      onClick={() => console.log('clicked')}
    >
      Create task
    </Button>
  )
}
```

### Variant Rules

- `variant` defines semantic visual intent.
- `size` controls dimensions and spacing only.
- `state` handles non-variant UI states (`loading`, `error`).
- `isLoading` has priority over `state` and applies `aria-busy`.
