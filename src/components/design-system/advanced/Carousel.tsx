import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../atoms'

export interface CarouselProps {
  slides: ReactNode[]
}

export function Carousel({ slides }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const total = slides.length

  if (!total) return null

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">{slides[index]}</div>
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => setIndex((current) => (current - 1 + total) % total)}>
          Prev
        </Button>
        <span className="text-xs text-[var(--text-muted)]">{index + 1} / {total}</span>
        <Button variant="secondary" size="sm" onClick={() => setIndex((current) => (current + 1) % total)}>
          Next
        </Button>
      </div>
    </div>
  )
}
