import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor: string
}

export function StatCard({ title, value, icon: Icon, iconColor }: Props) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{title}</p>
          <p className="text-[28px] leading-none font-semibold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
