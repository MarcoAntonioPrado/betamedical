interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  total?: number
  label?: string
  className?: string
}

function formatCount(total?: number) {
  if (typeof total !== 'number') return null
  return `${total} ${total === 1 ? 'resultado' : 'resultados'}`
}

export function SearchField({ value, onChange, placeholder, total, label = 'Busca', className = '' }: SearchFieldProps) {
  const countLabel = formatCount(total)
  const rootClassName = className ? `search-shell ${className}` : 'search-shell'

  return (
    <label className={rootClassName}>
      <span className="search-meta">
        <span className="search-kicker">{label}</span>
        {countLabel ? <span className="search-count">{countLabel}</span> : null}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}