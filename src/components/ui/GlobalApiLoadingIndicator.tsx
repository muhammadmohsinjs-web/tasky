import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Spinner } from '../design-system/atoms'
import {
  getPendingRequestCount,
  installGlobalFetchTracker,
  subscribeToNetworkActivity,
} from '../../lib/networkActivity'

const SHOW_DELAY_MS = 180
const MIN_VISIBLE_MS = 260

export function GlobalApiLoadingIndicator() {
  const pendingRequests = useSyncExternalStore(
    subscribeToNetworkActivity,
    getPendingRequestCount,
    () => 0
  )
  const [visible, setVisible] = useState(false)
  const visibleSinceRef = useRef<number | null>(null)

  useEffect(() => {
    installGlobalFetchTracker()
  }, [])

  useEffect(() => {
    if (pendingRequests > 0) {
      const showTimer = window.setTimeout(() => {
        visibleSinceRef.current = Date.now()
        setVisible(true)
      }, SHOW_DELAY_MS)

      return () => window.clearTimeout(showTimer)
    }

    if (!visible) return undefined

    const elapsed = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : MIN_VISIBLE_MS
    const hideAfter = Math.max(MIN_VISIBLE_MS - elapsed, 0)
    const hideTimer = window.setTimeout(() => {
      setVisible(false)
      visibleSinceRef.current = null
    }, hideAfter)

    return () => window.clearTimeout(hideTimer)
  }, [pendingRequests, visible])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[110] flex justify-center px-4">
      <div
        aria-live="polite"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
      >
        <Spinner size="sm" label="Loading API requests" className="text-blue-600" />
        <span className="text-xs font-medium text-slate-700">
          {pendingRequests > 1 ? `Loading ${pendingRequests} requests...` : 'Loading...'}
        </span>
      </div>
    </div>
  )
}
