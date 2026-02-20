import { useState } from 'react'
import { toast } from 'sonner'
import { fetchGoogleCalendarPreview } from '../lib/googleCalendar'

export function useGoogleCalendarPreview() {
  const [loading, setLoading] = useState(false)

  const fetchAndLog = async () => {
    setLoading(true)

    try {
      const preview = await fetchGoogleCalendarPreview()
      toast.success(`Fetched ${preview.calendars.length} calendars. Check console for event data.`)
      return preview
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Google Calendar preview data.'
      console.error('[Google Calendar] Preview Fetch Failed', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    fetchAndLog,
  }
}
