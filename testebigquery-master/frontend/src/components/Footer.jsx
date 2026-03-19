export default function Footer({ extra }) {
  return (
    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-2 border-t border-slate-200/60">
      <p>
        {extra && <>{extra} &middot; </>}
        Secretaria Municipal de Sa&uacute;de &middot; N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA)
      </p>
      <p className="text-slate-300">v1.0</p>
    </div>
  )
}
