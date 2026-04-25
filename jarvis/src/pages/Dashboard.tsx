import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  FileCode,
  FileJson,
  FileText,
  Send,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Music,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { DashboardStats, Project, Task } from '@/types'

// ─── HUD Panel ────────────────────────────────────────────────────────────────

interface HudPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  noPadding?: boolean
}

function HudPanel({ title, children, className = '', style, noPadding }: HudPanelProps) {
  return (
    <div
      className={`relative rounded-sm ${className}`}
      style={{
        background: 'rgba(7,9,15,0.88)',
        border: '1px solid rgba(14,165,233,0.14)',
        ...style,
      }}
    >
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sky-500/50 rounded-tl-sm" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sky-500/50 rounded-tr-sm" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-sky-500/50 rounded-bl-sm" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-sky-500/50 rounded-br-sm" />

      {title && (
        <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid rgba(14,165,233,0.1)' }}>
          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-[0.22em] font-mono">
            {title}
          </span>
        </div>
      )}

      <div className={noPadding ? '' : 'p-3'}>{children}</div>
    </div>
  )
}

// ─── 3D Central Orb ──────────────────────────────────────────────────────────

function CentralOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
      {/* Ambient glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -30,
          background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 68%)',
          filter: 'blur(16px)',
        }}
      />

      {/* Static outer decoration ring */}
      <div
        className="absolute rounded-full"
        style={{ width: 248, height: 248, border: '1px solid rgba(14,165,233,0.07)' }}
      />

      {/* Orbital ring 1 — large slow tilted */}
      <div
        className="absolute animate-spin-slow"
        style={{
          width: 215, height: 215,
          borderRadius: '50%',
          border: '1px solid rgba(14,165,233,0.22)',
          borderTopColor: 'rgba(56,189,248,0.65)',
          transform: 'rotateX(68deg)',
          boxShadow: '0 0 8px rgba(14,165,233,0.1)',
        }}
      >
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: 'rgba(56,189,248,1)', boxShadow: '0 0 10px rgba(56,189,248,1), 0 0 4px #fff' }}
        />
      </div>

      {/* Orbital ring 2 — reverse medium tilted+rotated */}
      <div
        className="absolute animate-spin-reverse-medium"
        style={{
          width: 172, height: 172,
          borderRadius: '50%',
          border: '1px solid rgba(14,165,233,0.18)',
          borderBottomColor: 'rgba(103,232,249,0.55)',
          transform: 'rotateX(68deg) rotateZ(55deg)',
        }}
      >
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: 'rgba(103,232,249,0.95)', boxShadow: '0 0 7px rgba(103,232,249,1)' }}
        />
      </div>

      {/* Vertical spinner */}
      <div
        className="absolute animate-spin-medium"
        style={{
          width: 188, height: 188,
          borderRadius: '50%',
          border: '1px solid rgba(14,165,233,0.12)',
          borderTopColor: 'rgba(14,165,233,0.40)',
        }}
      />

      {/* Inner fast ring */}
      <div
        className="absolute animate-spin-fast"
        style={{
          width: 128, height: 128,
          borderRadius: '50%',
          border: '1px solid rgba(56,189,248,0.14)',
          borderRightColor: 'rgba(56,189,248,0.45)',
          transform: 'rotateX(72deg)',
        }}
      />

      {/* Central sphere */}
      <div
        className="relative z-10"
        style={{
          width: 82, height: 82,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(125,211,252,0.92) 14%, rgba(14,165,233,0.82) 38%, rgba(7,89,133,0.6) 68%, rgba(3,55,110,0.4) 100%)',
          boxShadow:
            '0 0 30px rgba(14,165,233,0.95), 0 0 65px rgba(14,165,233,0.5), 0 0 120px rgba(14,165,233,0.18)',
          animation: 'pulseGlow 2.5s ease-in-out infinite, float 3.5s ease-in-out infinite',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            top: '18%', left: '22%', width: '28%', height: '22%',
            background: 'rgba(255,255,255,0.7)',
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* Downward beam */}
      <div
        className="absolute z-0 pointer-events-none"
        style={{
          top: '50%', left: '50%', transform: 'translateX(-50%)',
          width: 3, height: 68,
          background: 'linear-gradient(to bottom, rgba(14,165,233,0.85) 0%, rgba(14,165,233,0.35) 55%, transparent 100%)',
          boxShadow: '0 0 10px rgba(14,165,233,0.45)',
          filter: 'blur(0.4px)',
        }}
      />

      {/* Platform rings */}
      {[
        { w: 88,  h: 17, b: 10 },
        { w: 116, h: 23, b: 5  },
        { w: 148, h: 29, b: 0  },
        { w: 182, h: 36, b: -5 },
      ].map(({ w, h, b }, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: '50%', bottom: b,
            transform: 'translateX(-50%)',
            width: w, height: h,
            borderRadius: '50%',
            border: `1px solid rgba(14,165,233,${(0.35 - i * 0.07).toFixed(2)})`,
            boxShadow: i === 0 ? '0 0 8px rgba(14,165,233,0.2)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Wave Visualizer ─────────────────────────────────────────────────────────

function WaveVisualizer() {
  const heights = [0.3,0.5,0.8,0.6,1,0.7,0.9,0.4,0.8,0.5,1,0.6,0.7,0.9,0.4,0.8,0.5,0.6,1,0.4,0.7,0.5,0.8,0.6,0.9,0.3,0.7,0.5,0.6,0.8]
  return (
    <div className="flex items-end gap-0.5 h-5 px-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className="wave-bar rounded-sm"
          style={{
            width: 3,
            height: `${h * 100}%`,
            background: `rgba(14,165,233,${(0.35 + h * 0.5).toFixed(2)})`,
            animationDelay: `${(i * 0.048).toFixed(3)}s`,
            animationDuration: `${(0.9 + (i % 5) * 0.12).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Iron Man style silhouette ────────────────────────────────────────────────

function HumanFigure() {
  return (
    <svg width="44" height="76" viewBox="0 0 44 76" fill="none" className="flex-shrink-0 opacity-35">
      <circle cx="22" cy="8" r="6.5" stroke="rgba(14,165,233,0.75)" strokeWidth="0.6" />
      <line x1="22" y1="14.5" x2="22" y2="18" stroke="rgba(14,165,233,0.5)" strokeWidth="0.6" />
      <path d="M13 18 L22 15 L31 18 L32 40 L22 44 L12 40 Z" stroke="rgba(14,165,233,0.65)" strokeWidth="0.6" fill="rgba(14,165,233,0.04)" />
      <circle cx="22" cy="29" r="5" stroke="rgba(14,165,233,0.4)" strokeWidth="0.5" fill="rgba(14,165,233,0.06)" />
      <circle cx="22" cy="29" r="2" fill="rgba(14,165,233,0.7)" style={{ filter: 'blur(1px)' }} />
      <path d="M13 20 L5 36 L7 42"  stroke="rgba(14,165,233,0.55)" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M31 20 L39 36 L37 42" stroke="rgba(14,165,233,0.55)" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M17 44 L14 62 L16 72" stroke="rgba(14,165,233,0.55)" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M27 44 L30 62 L28 72" stroke="rgba(14,165,233,0.55)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="2"  y1="22" x2="10" y2="22" stroke="rgba(14,165,233,0.28)" strokeWidth="0.5" />
      <line x1="34" y1="22" x2="42" y2="22" stroke="rgba(14,165,233,0.28)" strokeWidth="0.5" />
    </svg>
  )
}

// ─── System Panel ─────────────────────────────────────────────────────────────

function SystemPanel() {
  const stats = [
    { label: 'STATUS',      value: 'ÓTIMO',    color: 'text-emerald-400' },
    { label: 'TEMPO ATIVO', value: '3h 42m',   color: 'text-sky-300'    },
    { label: 'PROCESSOS',   value: '128',       color: 'text-sky-300'    },
    { label: 'TEMPERATURA', value: '48°C',      color: 'text-amber-400'  },
    { label: 'VELOCIDADE',  value: '4.21 GHz',  color: 'text-sky-300'    },
  ]
  return (
    <HudPanel title="SISTEMA">
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-2">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider shrink-0">{label}</span>
              <span className={`text-[10px] font-bold font-mono ${color} tabular-nums`}>{value}</span>
            </div>
          ))}
        </div>
        <HumanFigure />
      </div>
    </HudPanel>
  )
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel() {
  const items = [
    { name: 'app.tsx',      time: 'Editado há 2m',  Icon: FileCode },
    { name: 'server.js',    time: 'Editado há 10m', Icon: FileCode },
    { name: 'main.py',      time: 'Editado há 45m', Icon: FileText },
    { name: 'package.json', time: 'Editado há 1h',  Icon: FileJson },
  ]
  return (
    <HudPanel title="ATIVIDADE RECENTE" className="flex-1">
      <div className="space-y-2.5">
        {items.map(({ name, time, Icon }) => (
          <div key={name} className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)' }}
            >
              <Icon size={11} className="text-sky-500/65" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-300 truncate font-mono">{name}</p>
              <p className="text-[8px] text-slate-600">{time}</p>
            </div>
          </div>
        ))}
      </div>
    </HudPanel>
  )
}

// ─── Command Input ────────────────────────────────────────────────────────────

function CommandInput() {
  const [input, setInput]               = useState('')
  const [response, setResponse]         = useState('')
  const [processing, setProcessing]     = useState(false)

  const handleSubmit = async () => {
    if (!input.trim() || processing) return
    setProcessing(true)
    await new Promise<void>((r) => setTimeout(r, 600))
    const lower = input.trim().toLowerCase()
    let res = ''
    if (lower === 'status') {
      try { await api.get('/health'); res = '✓ Todos os sistemas online · localhost:3001 respondendo' }
      catch { res = '✗ Backend offline — execute: npm run dev:backend' }
    } else {
      res = `Recebido: "${input.trim()}" · Integração com IA em desenvolvimento.`
    }
    setInput('')
    setResponse(res)
    setProcessing(false)
    setTimeout(() => setResponse(''), 6000)
  }

  return (
    <HudPanel title="COMANDO" noPadding>
      {response && (
        <div className="px-3 py-1.5 text-[10px] text-sky-400/75 font-mono" style={{ borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
          › {response}
        </div>
      )}
      <div className="flex items-center px-3 py-2.5 gap-2">
        <span className="text-sky-500/40 font-mono text-sm select-none">›</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Fale ou digite um comando para o JARVIS..."
          disabled={processing}
          className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 font-mono focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={processing || !input.trim()}
          className="text-slate-600 hover:text-sky-400 transition-colors disabled:opacity-30"
        >
          {processing ? (
            <div className="w-3.5 h-3.5 rounded-full" style={{ border: '1px solid rgba(14,165,233,0.5)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <Send size={13} />
          )}
        </button>
      </div>
      <div className="px-3 pb-2.5">
        <WaveVisualizer />
      </div>
    </HudPanel>
  )
}

// ─── Next Actions Panel ───────────────────────────────────────────────────────

function NextActionsPanel({ tasks }: { tasks: Task[] }) {
  const items =
    tasks.length > 0
      ? tasks.slice(0, 4).map((t) => ({ text: t.title, sub: 'Tarefa pendente' }))
      : [
          { text: 'Finalizar autenticação',  sub: 'Projeto: JARVIS' },
          { text: 'Corrigir integração API', sub: 'Projeto: Nexus'  },
          { text: 'Revisar código',          sub: 'Projeto: Orion'  },
          { text: 'Fazer deploy',            sub: 'Projeto: JARVIS' },
        ]

  return (
    <HudPanel title="PRÓXIMAS AÇÕES">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div
              className="w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ border: '1px solid rgba(14,165,233,0.45)', background: 'rgba(14,165,233,0.08)' }}
            >
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                <path d="M1 3.5L3 5.5L7 1" stroke="rgba(14,165,233,0.85)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-300 leading-snug">{item.text}</p>
              <p className="text-[8px] text-slate-600">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </HudPanel>
  )
}

// ─── Active Projects Panel ────────────────────────────────────────────────────

function ActiveProjectsPanel({ projects }: { projects: Project[] }) {
  const fallback = [
    { name: 'JARVIS', sub: 'Sistema principal', progress: 80, color: '#0EA5E9' },
    { name: 'NEXUS',  sub: 'Plataforma web',    progress: 55, color: '#0EA5E9' },
    { name: 'ORION',  sub: 'App mobile',         progress: 30, color: '#0EA5E9' },
  ]
  const display =
    projects.length > 0
      ? projects.slice(0, 3).map((p, i) => ({
          name:     p.name.toUpperCase(),
          sub:      p.description ?? 'Projeto ativo',
          progress: [80, 55, 30][i] ?? 50,
          color:    p.color,
        }))
      : fallback

  return (
    <HudPanel title="PROJETOS ATIVOS">
      <div className="space-y-3">
        {display.map(({ name, sub, progress, color }) => (
          <div key={name}>
            <div className="flex items-start justify-between mb-1.5 gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.05)' }}>
                  <FolderKanban size={11} className="text-sky-500/55" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white tracking-wide truncate">{name}</p>
                  <p className="text-[8px] text-slate-600 truncate">{sub}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color }}>{progress}%</span>
            </div>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,21,37,1)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${color}, rgba(56,189,248,0.45))`,
                  boxShadow: `0 0 6px ${color}90`,
                }}
              />
            </div>
          </div>
        ))}
        <Link to="/projects" className="text-[8.5px] text-sky-500/60 hover:text-sky-400 uppercase tracking-[0.18em] font-mono flex justify-end transition-colors">
          VER TODOS →
        </Link>
      </div>
    </HudPanel>
  )
}

// ─── AI Face SVG ─────────────────────────────────────────────────────────────

function AIFace() {
  return (
    <div
      className="w-14 h-16 rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden"
      style={{ border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.04)' }}
    >
      <svg width="34" height="40" viewBox="0 0 34 40" fill="none" opacity="0.72">
        <path d="M7 7 Q17 2 27 7 L28 22 Q26 33 17 36 Q8 33 6 22 Z" stroke="rgba(14,165,233,0.65)" strokeWidth="0.7" fill="rgba(14,165,233,0.04)" />
        <ellipse cx="12.5" cy="15" rx="2.8" ry="2.2" stroke="rgba(14,165,233,0.8)" strokeWidth="0.7" />
        <ellipse cx="21.5" cy="15" rx="2.8" ry="2.2" stroke="rgba(14,165,233,0.8)" strokeWidth="0.7" />
        <circle cx="12.5" cy="15" r="1.1" fill="rgba(14,165,233,0.95)" />
        <circle cx="21.5" cy="15" r="1.1" fill="rgba(14,165,233,0.95)" />
        <path d="M13 26 Q17 28.5 21 26" stroke="rgba(14,165,233,0.45)" strokeWidth="0.7" />
        <line x1="2"  y1="17" x2="7"  y2="17" stroke="rgba(14,165,233,0.25)" strokeWidth="0.5" />
        <line x1="27" y1="17" x2="32" y2="17" stroke="rgba(14,165,233,0.25)" strokeWidth="0.5" />
        <line x1="13" y1="5"  x2="21" y2="5"  stroke="rgba(14,165,233,0.2)"  strokeWidth="0.5" />
      </svg>
    </div>
  )
}

// ─── JARVIS AI Panel ──────────────────────────────────────────────────────────

function JarvisAIPanel() {
  return (
    <HudPanel title="JARVIS AI">
      <div className="flex gap-2.5">
        <div className="flex-1 space-y-1.5 min-w-0">
          <p className="text-[10px] text-sky-400/85">Analisando seu código...</p>
          <p className="text-[10px] text-slate-400">Detectei 3 melhorias possíveis.</p>
          <p className="text-[9px] text-slate-500">Deseja aplicar automaticamente?</p>
        </div>
        <AIFace />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-1.5 text-[10px] font-bold tracking-[0.2em] rounded-sm transition-all hover:brightness-110"
          style={{ background: 'rgba(14,165,233,0.14)', border: '1px solid rgba(14,165,233,0.45)', color: 'rgba(14,165,233,1)' }}
        >
          SIM
        </button>
        <button
          className="flex-1 py-1.5 text-[10px] font-bold tracking-[0.2em] rounded-sm transition-all hover:brightness-110"
          style={{ background: 'rgba(12,21,37,0.8)', border: '1px solid rgba(14,165,233,0.2)', color: 'rgba(148,163,184,0.85)' }}
        >
          MOSTRAR
        </button>
      </div>
    </HudPanel>
  )
}

// ─── Now Playing Panel ────────────────────────────────────────────────────────

function NowPlayingPanel() {
  const [playing, setPlaying] = useState(true)
  return (
    <HudPanel title="REPRODUZINDO">
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.18), rgba(14,165,233,0.04))', border: '1px solid rgba(14,165,233,0.2)' }}
        >
          <Music size={14} className="text-sky-400/55" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-slate-200 truncate">Interstellar</p>
          <p className="text-[8px] text-slate-600 truncate">Hans Zimmer</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="text-slate-700 hover:text-slate-400 transition-colors"><SkipBack size={11} /></button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:brightness-110"
            style={{ border: '1px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.1)' }}
          >
            {playing ? <Pause size={9} className="text-sky-400" /> : <Play size={9} className="text-sky-400" />}
          </button>
          <button className="text-slate-700 hover:text-slate-400 transition-colors"><SkipForward size={11} /></button>
        </div>
      </div>
    </HudPanel>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function Dashboard() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [pendingTasks,   setPendingTasks]   = useState<Task[]>([])
  const [backendError,   setBackendError]   = useState(false)

  useEffect(() => {
    Promise.allSettled([
      api.get<Project[]>('/api/projects?limit=3'),
      api.get<Task[]>('/api/tasks?limit=4&status=todo,in_progress'),
    ]).then(([pR, tR]) => {
      if (pR.status === 'fulfilled') setRecentProjects(pR.value)
      if (tR.status === 'fulfilled') setPendingTasks(tR.value)
      if (pR.status === 'rejected' && tR.status === 'rejected') setBackendError(true)
    })
  }, [])

  return (
    <div className="h-full flex gap-3 overflow-hidden">

      {/* ── LEFT ── */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <SystemPanel />
        <ActivityPanel />
      </div>

      {/* ── CENTER ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="text-center flex-shrink-0 pt-1">
          <h1
            className="text-[28px] font-black tracking-[0.55em] text-sky-400 select-none leading-none"
            style={{ textShadow: '0 0 20px rgba(14,165,233,0.85), 0 0 50px rgba(14,165,233,0.35)' }}
          >
            JARVIS
          </h1>
          <p className="text-[8px] font-mono text-sky-400/40 uppercase tracking-[0.4em] mt-1">
            SEU ASSISTENTE INTELIGENTE
          </p>
        </div>

        {backendError && (
          <div
            className="mx-auto px-4 py-1.5 rounded-sm text-[10px] font-mono flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(252,165,165,0.8)' }}
          >
            ! Backend offline — execute: npm run dev:backend
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
          <CentralOrb />
          <p className="text-sm font-light text-slate-200 mt-1 text-center select-none" style={{ textShadow: '0 0 12px rgba(14,165,233,0.3)' }}>
            Bom dia, Mestre.
          </p>
          <p className="text-[10px] text-sky-400/50 text-center mt-0.5 select-none">
            Como posso ajudar hoje?
          </p>
        </div>

        <div className="flex-shrink-0">
          <CommandInput />
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <NextActionsPanel tasks={pendingTasks} />
        <ActiveProjectsPanel projects={recentProjects} />
        <JarvisAIPanel />
        <NowPlayingPanel />
      </div>
    </div>
  )
}

