import { useState } from 'react'
import type { ReactNode } from 'react'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const open = item.id === openId

        return (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
            <button type="button" className="w-full px-4 py-3 text-left text-sm font-medium" onClick={() => setOpenId(open ? null : item.id)}>
              {item.title}
            </button>
            {open ? <div className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">{item.content}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
