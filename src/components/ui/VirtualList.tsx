import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface Props<T> {
  items: T[]
  itemHeight: number
  height: number
  overscan?: number
  className?: string
  renderItem: (item: T, index: number) => ReactNode
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  overscan = 4,
  className,
  renderItem,
}: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(height / itemHeight)

  const { start, end } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2)
    return { start: startIndex, end: endIndex }
  }, [items.length, scrollTop, itemHeight, overscan, visibleCount])

  const visibleItems = items.slice(start, end)

  return (
    <div
      className={className}
      style={{ height, overflowY: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * itemHeight}px)` }}>
          {visibleItems.map((item, idx) => renderItem(item, start + idx))}
        </div>
      </div>
    </div>
  )
}
