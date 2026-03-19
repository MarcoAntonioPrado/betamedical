const variants = {
  blue:   { border: 'border-t-gov-500',    icon: 'bg-gov-50 text-gov-600',       val: 'text-gov-700'   },
  green:  { border: 'border-t-health-500',  icon: 'bg-health-50 text-health-600',  val: 'text-health-700'  },
  red:    { border: 'border-t-red-600',     icon: 'bg-red-50 text-red-600',       val: 'text-red-700'    },
  yellow: { border: 'border-t-amber-500',   icon: 'bg-amber-50 text-amber-600',   val: 'text-amber-700'  },
  purple: { border: 'border-t-violet-500',  icon: 'bg-violet-50 text-violet-600', val: 'text-violet-700' },
  pink:   { border: 'border-t-rose-500',    icon: 'bg-rose-50 text-rose-600',     val: 'text-rose-700'   },
  orange: { border: 'border-t-orange-500',  icon: 'bg-orange-50 text-orange-600', val: 'text-orange-700' },
}

export default function KPICard({ label, value, desc, color = 'blue', icon: Icon }) {
  const v = variants[color] ?? variants.blue
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 border-t-[3px] ${v.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
            {label}
          </p>
          <p className={`text-3xl font-extrabold mt-1.5 leading-none ${v.val}`}>
            {value ?? '—'}
          </p>
          {desc && <p className="text-[11px] text-slate-400 mt-1.5">{desc}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${v.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
