import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Spinner } from '../atoms'

export interface InfiniteScrollProps {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  children: ReactNode
}

export function InfiniteScroll({ hasMore, loading, onLoadMore, children }: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onLoadMore()
      }
    })

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  return (
    <div>
      {children}
      <div ref={sentinelRef} className="flex justify-center py-3">
        {loading ? <Spinner /> : null}
      </div>
    </div>
  )
}
