import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Header({ active, pages, sidebarOpen, onToggleSidebar }) {
  const page = pages.find(p => p.id === active)
  const now  = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <header className="shrink-0 bg-white border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-gov-700 hover:bg-slate-100 transition-colors"
          title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-5 h-5" />
            : <PanelLeftOpen  className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-base font-bold text-gov-900">{page?.label}</h1>
          <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{now}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gov-600 bg-gov-50 border border-gov-200 px-3 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-health-500 animate-pulse" />
          Dados atualizados diariamente
        </span>
      </div>
    </header>
  )
}
