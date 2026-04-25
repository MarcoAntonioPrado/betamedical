import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomBar } from './BottomBar'
import { useAppStore } from '@/store/useAppStore'
import { clsx } from 'clsx'

export function MainLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <div className="flex flex-col h-screen bg-hud-bg overflow-hidden hud-grid">
      {/* Top bar */}
      <Header />

      {/* Content row */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main
          className={clsx(
            'flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 p-4',
            sidebarOpen ? 'ml-52' : 'ml-14',
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom bar */}
      <BottomBar />
    </div>
  )
}

