import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Tag, BarChart3, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-800">Tasky</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
