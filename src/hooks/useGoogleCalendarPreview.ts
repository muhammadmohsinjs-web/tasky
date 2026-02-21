import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { fetchGoogleCalendarPreview } from '../lib/googleCalendar'

export function useGoogleCalendarPreview() {
  const [loading, setLoading] = useState(false)

  const fetchAndLog = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    setLoading(true)

    try {
      const preview = await fetchGoogleCalendarPreview()
      if (!silent) {
        toast.success(`Fetched ${preview.calendars.length} calendars. Check console for event data.`)
      }
      return preview
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Google Calendar preview data.'
      console.error('[Google Calendar] Preview Fetch Failed', error)
      if (!silent) {
        toast.error(message)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    fetchAndLog,
  }
}
