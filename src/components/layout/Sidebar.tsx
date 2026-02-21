import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, CalendarDays, Tag, BarChart3, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { UserAvatar } from '../ui/UserAvatar';
import tasksPulseLogo from '../../assets/TasksPulse-logo-horizontal.svg';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, description: 'Manage your work' },
  { path: '/events', label: 'Events', icon: CalendarDays, description: 'View schedule' },
  { path: '/categories', label: 'Categories', icon: Tag, description: 'Organize tasks' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, description: 'Track progress' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1200);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSidebar = isDesktop || mobileOpen;

  return (
    <>
      {!isDesktop && (
        <button onClick={() => setMobileOpen(true)} className="fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      )}

      {!isDesktop && mobileOpen && <div className="fixed inset-0 bg-slate-950/35 z-40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`
        ${isDesktop ? 'sticky top-0' : 'fixed inset-y-0'} left-0 z-50
        w-[272px] h-screen bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col
        transform transition-transform duration-300 ease-out
        ${showSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink to="/" onClick={() => setMobileOpen(false)} className="inline-flex">
              <img src={tasksPulseLogo} alt="TasksPulse logo" className={`${isDesktop ? 'h-16 max-w-[240px]' : 'h-10 max-w-[170px]'} w-auto object-contain`} />
            </NavLink>
          </div>
          <button onClick={() => setMobileOpen(false)} className={`${isDesktop ? 'hidden' : ''} p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-4 h-px bg-slate-200" />

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-[0.16em] uppercase">Navigation</p>
          {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative border ${
                  isActive ? 'bg-blue-50/70 border-blue-100 text-slate-800 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }>
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      isActive ? 'bg-white text-blue-600 shadow-xs' : 'bg-slate-100/0 group-hover:bg-slate-100 text-slate-400 group-hover:text-slate-600'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">{label}</span>
                    <span className={`block text-[10px] font-normal leading-tight mt-0.5 transition-colors ${isActive ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                      {description}
                    </span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-4 h-px bg-slate-200" />

        <div className="px-3 py-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <UserAvatar avatarUrl={profile?.avatar_url} displayName={profile?.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-700 truncate leading-tight">{profile?.display_name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
