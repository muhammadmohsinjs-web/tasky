import type { CalendarDay } from './types'

export const MOCK_CALENDAR_DAYS: CalendarDay[] = [
  {
    date: new Date(2026, 1, 16),
    isToday: false,
    isCurrentMonth: true,
    events: [
      { id: 'evt-1', title: 'Product Review', startTime: '09:00', type: 'work' },
      { id: 'evt-2', title: 'Design Sync', startTime: '11:30', type: 'meeting' },
      { id: 'evt-3', title: 'Gym', startTime: '18:30', type: 'personal' },
      { id: 'evt-4', title: 'Invoice Follow-up', startTime: '19:00', type: 'finance' },
      { id: 'evt-5', title: 'Launch Prep', startTime: '20:30', type: 'important' },
    ],
  },
  {
    date: new Date(2026, 1, 17),
    isToday: false,
    isCurrentMonth: true,
    events: [
      { id: 'evt-6', title: 'Client Call', startTime: '10:00', type: 'meeting' },
      { id: 'evt-7', title: 'Sprint Planning', startTime: '14:00', type: 'work' },
    ],
  },
]
