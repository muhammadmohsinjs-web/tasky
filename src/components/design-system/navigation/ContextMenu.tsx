import type { ReactNode } from 'react'
import { DropdownMenu, type DropdownItem } from '../data-display'

export interface ContextMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
}

export function ContextMenu({ trigger, items }: ContextMenuProps) {
  return <DropdownMenu trigger={trigger} items={items} />
}
