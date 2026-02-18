import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Tag, BarChart3, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { UserAvatar } from '../ui/UserAvatar'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()
  const { profile } = useProfile()

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
        w-64 bg-white border-r border-slate-200/80 flex flex-col shadow-sm
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <CheckSquare className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Tasky</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <UserAvatar avatarUrl={profile?.avatar_url} displayName={profile?.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {profile?.display_name || 'User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {profile?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[15px] font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
