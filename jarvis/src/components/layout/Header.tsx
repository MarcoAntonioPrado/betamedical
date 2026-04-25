import { useState, useEffect } from 'react'
import { Wifi, Cpu, HardDrive, Activity, Settings, RefreshCw, Globe } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

// ─── Live clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')
  const days   = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO']
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

  return (
    <div className="text-center select-none">
      <div
        className="text-xl font-mono font-bold text-white tracking-[0.12em] tabular-nums leading-none"
        style={{ textShadow: '0 0 20px rgba(14,165,233,0.6), 0 0 40px rgba(14,165,233,0.25)' }}
      >
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="text-sky-500/60">:{pad(now.getSeconds())}</span>
      </div>
      <div className="text-[8px] font-mono text-sky-400/40 uppercase tracking-[0.3em] mt-0.5">
        {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]} {now.getFullYear()}
      </div>
    </div>
  )
}

// ─── System stat bar ─────────────────────────────────────────────────────────

function StatBar({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex items-center gap-1">
        <Icon size={9} className={colorClass} />
        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className="w-10 h-0.5 bg-hud-alt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${value}%`, boxShadow: '0 0 4px currentColor' }}
        />
      </div>
      <span className="text-[9px] font-mono text-slate-500">{value}%</span>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { isLoading } = useAppStore()

  return (
    <header
      className="h-14 flex items-center px-5 flex-shrink-0 relative z-50 border-b border-hud-border"
      style={{ background: 'rgba(4,7,15,0.98)', backdropFilter: 'blur(12px)' }}
    >
      {/* ─── Left: Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 w-52 flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 animate-flicker"
          style={{
            background: 'rgba(14,165,233,0.08)',
            border: '1px solid rgba(14,165,233,0.35)',
            boxShadow: '0 0 14px rgba(14,165,233,0.25)',
          }}
        >
          <span className="text-sky-400 font-bold text-sm font-mono select-none">J</span>
        </div>
        <span
          className="text-[22px] font-black tracking-[0.3em] text-sky-400 select-none"
          style={{ textShadow: '0 0 20px rgba(14,165,233,0.8), 0 0 50px rgba(14,165,233,0.3)' }}
        >
          JARVIS
        </span>
        {isLoading && (
          <div
            className="w-3 h-3 rounded-full border border-sky-500/60 flex-shrink-0"
            style={{ borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }}
          />
        )}
      </div>

      {/* ─── Center: Clock + Stats ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center gap-10">
        <LiveClock />

        {/* Divider */}
        <div className="w-px h-7 bg-hud-border flex-shrink-0" />

        {/* System stats */}
        <div className="flex items-center gap-6">
          <StatBar icon={Activity}   label="Sistema" value={100} colorClass="text-emerald-400" />
          <StatBar icon={Cpu}        label="CPU"     value={23}  colorClass="text-sky-400" />
          <StatBar icon={HardDrive}  label="RAM"     value={45}  colorClass="text-sky-400" />
          <StatBar icon={Wifi}       label="Rede"    value={68}  colorClass="text-sky-400" />
        </div>
      </div>

      {/* ─── Right: controls ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 w-52 justify-end flex-shrink-0">
        {[
          { Icon: RefreshCw, title: 'Atualizar' },
          { Icon: Globe,     title: 'Rede'      },
          { Icon: Settings,  title: 'Config'    },
        ].map(({ Icon, title }) => (
          <button
            key={title}
            title={title}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all border border-hud-border"
          >
            <Icon size={11} />
          </button>
        ))}

        {/* Window controls */}
        <div className="flex items-center gap-0.5 ml-2">
          {['─', '□', '✕'].map((s, i) => (
            <button
              key={i}
              className={`w-5 h-5 text-[10px] flex items-center justify-center rounded transition-all
                ${i === 2 ? 'hover:bg-red-500/80 hover:text-white' : 'hover:bg-hud-alt'}
                text-slate-700 hover:text-slate-300`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.25) 25%, rgba(14,165,233,0.5) 50%, rgba(14,165,233,0.25) 75%, transparent 100%)',
        }}
      />
    </header>
  )
}
