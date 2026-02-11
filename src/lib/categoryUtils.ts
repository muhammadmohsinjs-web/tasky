import type { Category } from '../types'

export function categoryStyle(category?: Category | null): string {
  return category?.color ?? 'bg-slate-100 text-slate-600'
}

export function categoryAccent(category?: Category | null): string {
  return category?.accent ?? 'border-l-slate-300'
}

export function categoryDot(category?: Category | null): string {
  if (!category?.accent) return 'bg-slate-300'
  return category.accent.replace('border-l-', 'bg-')
}

export function categoryLabel(category?: Category | null): string {
  return category?.short_label ?? 'GEN'
}
