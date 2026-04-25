import { MessageSquare, Code2, Zap, Terminal, Brain, Mic, BarChart3, Settings } from 'lucide-react'

const actions = [
  { icon: MessageSquare, label: 'CHAT IA'    },
  { icon: Code2,         label: 'CÓDIGO'     },
  { icon: Zap,           label: 'AUTOMAÇÕES' },
  { icon: Terminal,      label: 'TERMINAL'   },
  { icon: Brain,         label: 'MEMÓRIA'    },
  { icon: Mic,           label: 'VOZ'        },
  { icon: BarChart3,     label: 'ANÁLISES'   },
  { icon: Settings,      label: 'CONFIG'     },
]

// Hexagonal shape via two layered divs (outer = border color, inner = fill)
function HexButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

  return (
    <button className="flex flex-col items-center gap-1.5 group select-none">
      <div className="relative w-11 h-11">
        {/* Outer hex — border colour */}
        <div
          className="absolute inset-0 transition-all duration-150 group-hover:opacity-100 opacity-60"
          style={{ clipPath: HEX, background: 'rgba(14,165,233,0.22)' }}
        />
        {/* Inner hex — dark fill */}
        <div
          className="absolute transition-all duration-150"
          style={{
            top: '9%', left: '9%', right: '9%', bottom: '9%',
            clipPath: HEX,
            background: 'rgba(4,7,15,0.92)',
          }}
        />
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            size={15}
            className="text-slate-600 group-hover:text-sky-400 transition-colors duration-150"
          />
        </div>
      </div>
      <span className="text-[7.5px] font-mono text-slate-700 group-hover:text-sky-400/70 uppercase tracking-[0.12em] transition-colors duration-150">
        {label}
      </span>
    </button>
  )
}

export function BottomBar() {
  return (
    <div
      className="h-[74px] border-t border-hud-border flex items-center justify-center gap-5 px-6 flex-shrink-0 relative"
      style={{ background: 'rgba(4,7,15,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.2) 30%, rgba(14,165,233,0.4) 50%, rgba(14,165,233,0.2) 70%, transparent 100%)',
        }}
      />

      {actions.map((a) => (
        <HexButton key={a.label} {...a} />
      ))}
    </div>
  )
}
