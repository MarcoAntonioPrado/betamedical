import { NavLink, useMatch } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Code2,
  Zap,
  Terminal,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { clsx } from 'clsx'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'CENTRAL',       sub: 'Visão geral do sistema', disabled: false },
  { to: '/projects',    icon: FolderKanban,    label: 'PROJETOS',      sub: 'Gerenciar projetos',      disabled: false },
  { to: '/tasks',       icon: CheckSquare,     label: 'TAREFAS',       sub: 'Acompanhar tarefas',      disabled: false },
  { to: '/code',        icon: Code2,           label: 'CÓDIGO',        sub: 'Analisar e gerar código', disabled: true  },
  { to: '/automations', icon: Zap,             label: 'AUTOMAÇÕES',    sub: 'Executar automações',     disabled: true  },
  { to: '/terminal',    icon: Terminal,        label: 'TERMINAL',      sub: 'Linha de comando',        disabled: true  },
  { to: '/memory',      icon: Brain,           label: 'MEMÓRIA',       sub: 'Base de conhecimento',    disabled: true  },
  { to: '/settings',    icon: Settings,        label: 'CONFIGURAÇÕES', sub: 'Ajustes do sistema',      disabled: true  },
]

// ─── SVG Globe Hologram ──────────────────────────────────────────────────────

function GlobeHologram() {
  return (
    <div className="relative flex flex-col items-center justify-end pb-1 h-full overflow-hidden">
      {/* Globe sphere */}
      <div
        className="relative mb-3"
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 38% 35%, rgba(14,165,233,0.35) 0%, rgba(14,165,233,0.12) 45%, rgba(14,165,233,0.04) 75%)',
          border: '1px solid rgba(14,165,233,0.30)',
          boxShadow: '0 0 18px rgba(14,165,233,0.18)',
        }}
      >
        {/* Latitude lines */}
        {[28, 48, 68].map((top, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`, left: '8%', right: '8%', height: 1,
              background: `rgba(14,165,233,${0.18 - i * 0.04})`,
            }}
          />
        ))}
        {/* Longitude arcs */}
        {[28, 50, 72].map((left, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`, top: '5%', bottom: '5%', width: 1,
              background: `rgba(14,165,233,${0.14 - i * 0.03})`,
            }}
          />
        ))}
        {/* Grid glow dot */}
        <div
          className="absolute w-2 h-2 rounded-full animate-pulse"
          style={{
            top: '28%', left: '58%',
            background: 'rgba(14,165,233,0.9)',
            boxShadow: '0 0 6px rgba(14,165,233,1)',
          }}
        />
      </div>

      {/* Base rings */}
      {[72, 96, 120].map((w, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            bottom: 4 + i * 3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: w,
            height: Math.round(w * 0.22),
            border: `1px solid rgba(14,165,233,${0.25 - i * 0.06})`,
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  )
}

// ─── Nav Item ────────────────────────────────────────────────────────────────

function NavItem({
  to,
  icon: Icon,
  label,
  sub,
  disabled,
  expanded,
}: {
  to: string
  icon: React.ElementType
  label: string
  sub: string
  disabled: boolean
  expanded: boolean
}) {
  const match = useMatch(to)
  const isActive = !!match && !disabled

  return (
    <NavLink
      to={disabled ? '#' : to}
      tabIndex={disabled ? -1 : undefined}
      title={!expanded ? label : undefined}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      className={clsx(
        'relative flex items-center transition-all duration-150 select-none',
        expanded ? 'px-4 py-2.5 gap-3' : 'py-3 justify-center',
        isActive  ? 'text-sky-400' : 'text-slate-600 hover:text-slate-300',
        disabled  ? 'opacity-30 cursor-default pointer-events-none' : 'cursor-pointer',
      )}
    >
      {/* Active left bar */}
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
          style={{ background: 'rgba(14,165,233,0.9)', boxShadow: '0 0 6px rgba(14,165,233,0.8)' }}
        />
      )}

      {/* Active background */}
      {isActive && (
        <span
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(14,165,233,0.08) 0%, transparent 100%)',
          }}
        />
      )}

      <Icon size={15} className="flex-shrink-0 relative z-10" />

      {expanded && (
        <div className="min-w-0 relative z-10">
          <p className="text-[11px] font-bold tracking-[0.08em] leading-tight">{label}</p>
          <p className="text-[8.5px] text-slate-700 truncate leading-tight mt-0.5">{sub}</p>
        </div>
      )}
    </NavLink>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <aside
      className={clsx(
        'fixed left-0 top-14 flex flex-col z-40 border-r border-hud-border transition-[width] duration-200',
        sidebarOpen ? 'w-52' : 'w-14',
      )}
      style={{
        height: 'calc(100vh - 3.5rem - 74px)',
        background: 'rgba(4,7,15,0.97)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} expanded={sidebarOpen} />
        ))}
      </nav>

      {/* ─── JARVIS ONLINE status ────────────────────────────────────────── */}
      <div className="border-t border-hud-border px-3 py-2.5 flex-shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0 animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(14,165,233,0.9)' }}
            />
            <div>
              <p className="text-[9px] font-bold text-sky-400 tracking-[0.15em]">JARVIS ONLINE</p>
              <p className="text-[7.5px] text-slate-700 tracking-wide">Todos os sistemas operacionais</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"
              style={{ boxShadow: '0 0 6px rgba(14,165,233,0.9)' }}
            />
          </div>
        )}
      </div>

      {/* ─── Globe hologram ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="h-28 flex-shrink-0 border-t border-hud-border/40 relative overflow-hidden">
          <GlobeHologram />
        </div>
      )}

      {/* ─── Collapse toggle ─────────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className={clsx(
          'flex items-center py-2.5 border-t border-hud-border/40',
          'text-slate-700 hover:text-slate-400 hover:bg-white/5 transition-colors',
          sidebarOpen ? 'px-4 gap-1.5 justify-end' : 'justify-center',
        )}
        title={sidebarOpen ? 'Recolher' : 'Expandir'}
      >
        {sidebarOpen ? (
          <>
            <span className="text-[8px] uppercase font-mono tracking-wider">Recolher</span>
            <ChevronLeft size={11} />
          </>
        ) : (
          <ChevronRight size={11} />
        )}
      </button>
    </aside>
  )
}
