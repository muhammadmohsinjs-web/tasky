import { useMemo } from 'react'
import type { ReactNode } from 'react'

export interface VirtualizedListProps<TItem> {
  items: TItem[]
  itemHeight: number
  height: number
  scrollTop: number
  renderItem: (item: TItem, index: number) => ReactNode
}

export function VirtualizedList<TItem>({ items, itemHeight, height, scrollTop, renderItem }: VirtualizedListProps<TItem>) {
  const start = Math.floor(scrollTop / itemHeight)
  const visibleCount = Math.ceil(height / itemHeight) + 2
  const slice = useMemo(() => items.slice(start, start + visibleCount), [items, start, visibleCount])

  return (
    <div style={{ height, overflow: 'auto' }}>
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * itemHeight}px)` }}>
          {slice.map((item, index) => (
            <div key={start + index} style={{ height: itemHeight }}>
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
