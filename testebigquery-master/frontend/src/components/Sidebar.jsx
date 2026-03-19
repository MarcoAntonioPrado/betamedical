import {
  LayoutDashboard, HeartPulse, FlaskConical,
  AlertTriangle, Activity, BookOpen, ShieldCheck,
} from 'lucide-react'

const ICONS = { LayoutDashboard, HeartPulse, FlaskConical, AlertTriangle, BookOpen }

export default function Sidebar({ active, setActive, pages, open }) {
  return (
    <aside
      className={`shrink-0 flex flex-col shadow-xl
        transition-all duration-300 ease-in-out overflow-hidden
        ${open ? 'w-64' : 'w-16'}`}
      style={{ background: 'linear-gradient(to bottom, #0f172a, #12305a)' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 py-5 transition-all duration-300
        ${open ? 'gap-3 px-5' : 'justify-center px-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/25 shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${open ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          <p className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Painel Gestantes</p>
          <p className="text-slate-400 text-[11px] whitespace-nowrap">SMS &middot; Rio de Janeiro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {pages.map(page => {
          const Icon = ICONS[page.icon]
          const isActive = active === page.id
          return (
            <button
              key={page.id}
              onClick={() => setActive(page.id)}
              title={!open ? page.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${open ? 'px-3 text-left' : 'justify-center px-0'}
                ${isActive
                  ? 'bg-white/10 text-white font-medium border-l-[3px] border-teal-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent'
                }`}
            >
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : ''}`} />}
              <span className={`truncate transition-all duration-300 ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                {page.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 transition-all duration-300 ${open ? 'px-5 py-4' : 'py-4'}`}>
        <p className={`text-slate-500 text-[10px] text-center transition-all duration-300 uppercase tracking-wider ${open ? 'opacity-100' : 'opacity-0'}`}>
          Secretaria Municipal de Sa&uacute;de
        </p>
      </div>
    </aside>
  )
}
