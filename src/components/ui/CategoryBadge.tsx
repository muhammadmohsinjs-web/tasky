import type { Category } from '../../types'
import { categoryStyle, categoryLabel } from '../../lib/categoryUtils'

interface Props {
  category?: Category | null
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span className={`shrink-0 font-semibold rounded-full whitespace-nowrap ${categoryStyle(category)} ${sizeClass}`}>
      {categoryLabel(category)}
    </span>
  )
}
