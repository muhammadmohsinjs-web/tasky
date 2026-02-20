import type { ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: ReactNode
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string
}

export function Breadcrumb({ items, separator = '/' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 ? <span>{separator}</span> : null}
            {item.href ? (
              <a href={item.href} className="inline-flex items-center gap-1 hover:text-[var(--text-strong)]">
                {item.icon}
                {item.label}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-[var(--text-strong)]">{item.icon}{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
