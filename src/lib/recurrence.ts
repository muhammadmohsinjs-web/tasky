import type { RecurrenceRule } from '../types'

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function expandRecurrence(
  startDate: string,
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date
): string[] {
  const results: string[] = []
  const start = parseDate(startDate)
  let count = 0
  const maxIterations = 500

  if (rule.frequency === 'weekly' && rule.days_of_week?.length) {
    // For weekly with specific days, iterate day-by-day within each interval period
    const weekStart = new Date(start)
    let iterations = 0

    while (weekStart <= rangeEnd && iterations < maxIterations) {
      for (const dow of rule.days_of_week) {
        const current = new Date(weekStart)
        const dayDiff = dow - current.getDay()
        current.setDate(current.getDate() + (dayDiff >= 0 ? dayDiff : dayDiff + 7))

        if (current < start) continue
        if (current > rangeEnd) break
        if (rule.end_date && current > parseDate(rule.end_date)) break
        if (rule.count && count >= rule.count) break

        if (current >= rangeStart) {
          results.push(formatDateStr(current))
        }
        count++
      }

      if (rule.count && count >= rule.count) break
      if (rule.end_date && weekStart > parseDate(rule.end_date)) break

      weekStart.setDate(weekStart.getDate() + 7 * rule.interval)
      iterations++
    }
  } else {
    const current = new Date(start)
    let iterations = 0

    while (current <= rangeEnd && iterations < maxIterations) {
      if (current >= start) {
        if (rule.end_date && current > parseDate(rule.end_date)) break
        if (rule.count && count >= rule.count) break

        if (current >= rangeStart) {
          results.push(formatDateStr(current))
        }
        count++
      }

      switch (rule.frequency) {
        case 'daily':
          current.setDate(current.getDate() + rule.interval)
          break
        case 'weekly':
          current.setDate(current.getDate() + 7 * rule.interval)
          break
        case 'monthly':
          current.setMonth(current.getMonth() + rule.interval)
          break
        case 'yearly':
          current.setFullYear(current.getFullYear() + rule.interval)
          break
      }
      iterations++
    }
  }

  return results
}
