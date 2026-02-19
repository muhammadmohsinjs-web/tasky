import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Tag, BarChart3, Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { UserAvatar } from '../ui/UserAvatar'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, description: 'Manage your work' },
  { path: '/categories', label: 'Categories', icon: Tag, description: 'Organize tasks' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, description: 'Track progress' },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()
  const { profile } = useProfile()
  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-lg shadow-slate-200/50 cursor-pointer hover:bg-white hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/25 z-40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-68 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 flex flex-col
        transform transition-all duration-300 ease-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-sm'}
      `}>
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-[14px] bg-linear-to-br from-slate-700 via-slate-800 to-zinc-900 flex items-center justify-center shadow-lg shadow-slate-800/30 group-hover:shadow-slate-800/50 transition-shadow duration-300">
                <CheckSquare className="w-4.75 h-4.75 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[19px] font-bold tracking-tight text-slate-800 leading-tight">Tasky</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">Workspace</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-4 pb-2 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">Menu</p>
          {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-linear-to-r from-slate-100 to-zinc-100/50 text-slate-800 shadow-sm shadow-slate-200/50'
                    : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-slate-700 rounded-full" />
                  )}
                  <div className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-slate-200/80 text-slate-700'
                      : 'bg-slate-100/0 group-hover:bg-slate-100 text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">{label}</span>
                    <span className={`block text-[10px] font-normal leading-tight mt-0.5 transition-colors ${
                      isActive ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'
                    }`}>{description}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="mx-5 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        <div className="px-3 py-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50/80 transition-colors group cursor-default">
            <UserAvatar avatarUrl={profile?.avatar_url} displayName={profile?.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-700 truncate leading-tight">
                {profile?.display_name || 'User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                {profile?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50/80 rounded-xl transition-all duration-200 cursor-pointer group"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-[-8deg] transition-transform duration-200" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
