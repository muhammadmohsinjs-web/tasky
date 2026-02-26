import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AICommandBar } from '../ai/AICommandBar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <AICommandBar />
    </div>
  )
}
