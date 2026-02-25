type Listener = () => void

const FETCH_TRACKER_MARKER = '__taskyFetchTrackerInstalled__'

let pendingRequests = 0
const listeners = new Set<Listener>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function incrementPendingRequests() {
  pendingRequests += 1
  emitChange()
}

function decrementPendingRequests() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  emitChange()
}

export function getPendingRequestCount() {
  return pendingRequests
}

export function subscribeToNetworkActivity(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function installGlobalFetchTracker() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return

  const trackedWindow = window as Window & { [FETCH_TRACKER_MARKER]?: boolean }
  if (trackedWindow[FETCH_TRACKER_MARKER]) return

  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (...args) => {
    incrementPendingRequests()
    try {
      return await nativeFetch(...args)
    } finally {
      decrementPendingRequests()
    }
  }

  trackedWindow[FETCH_TRACKER_MARKER] = true
}
