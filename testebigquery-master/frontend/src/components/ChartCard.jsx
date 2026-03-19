export default function ChartCard({ title, subtitle, badge, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold text-gov-600 bg-gov-50 border border-gov-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
