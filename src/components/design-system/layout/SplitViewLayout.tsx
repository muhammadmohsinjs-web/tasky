import type { ReactNode } from 'react'

export interface SplitViewLayoutProps {
  primary: ReactNode
  secondary: ReactNode
  secondaryWidthClassName?: string
}

export function SplitViewLayout({ primary, secondary, secondaryWidthClassName = 'w-full lg:w-96' }: SplitViewLayoutProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <main className="min-w-0 flex-1">{primary}</main>
      <aside className={secondaryWidthClassName}>{secondary}</aside>
    </div>
  )
}
