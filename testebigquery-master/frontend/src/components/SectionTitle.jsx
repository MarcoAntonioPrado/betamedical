export default function SectionTitle({ children, color = 'bg-gov-500' }) {
  return (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className={`inline-block w-3 h-0.5 rounded-full ${color}`} />
      {children}
    </p>
  )
}
