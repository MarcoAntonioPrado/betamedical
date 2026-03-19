import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'

const DEVE_OPTIONS  = ['Todos', 'Sim', 'N\u00e3o', 'Avaliar']
const ENC_OPTIONS   = ['Todos', 'Sim', 'N\u00e3o']
const LIMIT         = 100

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

function Select({ label, value, onChange, options, placeholder = 'Todos' }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-300 focus:border-gov-400 cursor-pointer truncate"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gov-300 focus:border-gov-400"
      />
    </div>
  )
}

function Badge({ value }) {
  if (!value || value === 'N\u00e3o' || value === 'Não') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
        N&atilde;o
      </span>
    )
  }
  if (value === 'Sim') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
        Sim
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
      {value}
    </span>
  )
}

function EncBadge({ encaminhada, deve }) {
  const shouldEnc = deve && deve.includes('Sim')
  const notEnc    = encaminhada === 'N\u00e3o' || encaminhada === 'Não'
  if (shouldEnc && notEnc) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
        N&atilde;o
      </span>
    )
  }
  return <Badge value={encaminhada} />
}

export default function AltoRiscoListagem() {
  const [filters, setFilters] = useState({
    ap: '', unidade: '', equipe: '', nome: '', categoria: '',
    deve_encaminhar: '', encaminhada: '', cpf: '',
  })
  const [page,  setPage]  = useState(1)
  const [data,  setData]  = useState(null)
  const [filterOpts, setFilterOpts] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [tableLoad,  setTableLoad]  = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    api.altoRiscoFilters()
      .then(setFilterOpts)
      .catch(e => setError(e.message))
  }, [])

  const fetchData = useCallback(async (f, p) => {
    setTableLoad(true)
    try {
      const params = { page: p, limit: LIMIT }
      if (f.ap)             params.ap             = f.ap
      if (f.unidade)        params.unidade         = f.unidade
      if (f.equipe)         params.equipe          = f.equipe
      if (f.nome)           params.nome            = f.nome
      if (f.cpf)            params.cpf             = f.cpf
      if (f.categoria)      params.categoria       = f.categoria
      if (f.deve_encaminhar && f.deve_encaminhar !== 'Todos') params.deve_encaminhar = f.deve_encaminhar
      if (f.encaminhada    && f.encaminhada    !== 'Todos') params.encaminhada     = f.encaminhada
      const result = await api.altoRisco(params)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setTableLoad(false)
    }
  }, [])

  const debouncedFetch = useRef(debounce((f, p) => fetchData(f, p), 500)).current

  useEffect(() => {
    fetchData(filters, 1)
  }, []) // eslint-disable-line

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    setPage(1)
    if (key === 'nome' || key === 'cpf') {
      debouncedFetch(next, 1)
    } else {
      fetchData(next, 1)
    }
  }

  const clearFilters = () => {
    const cleared = { ap: '', unidade: '', equipe: '', nome: '', categoria: '', deve_encaminhar: '', encaminhada: '', cpf: '' }
    setFilters(cleared)
    setPage(1)
    fetchData(cleared, 1)
  }

  const goPage = (p) => {
    setPage(p)
    fetchData(filters, p)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-health-100 border-t-health-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-rose-50 text-rose-600 rounded-xl p-6 text-sm">{error}</div>
      </div>
    )
  }

  const totalRows = data?.total ?? 0
  const totalPages = data?.pages ?? 1

  return (
    <div className="space-y-4 pb-4">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Listagem Nominal &ndash; Gestantes Alto Risco</h2>
          <p className="text-xs text-slate-400 mt-0.5">Fonte: PEP &middot; NIA</p>
        </div>
        <div className="ml-auto shrink-0 bg-gov-50 border border-gov-200 rounded-xl px-4 py-2.5 text-right">
          <p className="text-[10px] font-bold text-gov-500 uppercase tracking-widest">Total de Casos (n)</p>
          <p className="text-2xl font-black text-gov-700 leading-tight">{totalRows.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          <Select label="AP"     value={filters.ap}       onChange={v => updateFilter('ap', v)}
            options={filterOpts?.aps ?? []} />
          <div className="col-span-2">
            <Select label="Unidade" value={filters.unidade} onChange={v => updateFilter('unidade', v)}
              options={filterOpts?.unidades ?? []} />
          </div>
          <Select label="Equipe" value={filters.equipe}   onChange={v => updateFilter('equipe', v)}
            options={filterOpts?.equipes ?? []} />
          <TextInput label="Nome" value={filters.nome}    onChange={v => updateFilter('nome', v)}
            placeholder="Buscar..." />
          <Select label="Categoria de risco" value={filters.categoria} onChange={v => updateFilter('categoria', v)}
            options={filterOpts?.categorias ?? []} />
          <Select label="Deve encaminhar?" value={filters.deve_encaminhar} onChange={v => updateFilter('deve_encaminhar', v)}
            options={DEVE_OPTIONS} />
          <Select label="Encaminhada?" value={filters.encaminhada} onChange={v => updateFilter('encaminhada', v)}
            options={ENC_OPTIONS} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <TextInput label="CPF" value={filters.cpf} onChange={v => updateFilter('cpf', v)} placeholder="Buscar CPF..." />
          <button
            onClick={clearFilters}
            className="ml-4 mt-4 shrink-0 px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg uppercase tracking-widest transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`overflow-x-auto ${tableLoad ? 'opacity-60 pointer-events-none' : ''} transition-opacity`}>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-indigo-700 text-white">
                {['AP','Unidade','Equipe','Nome','Idade','IG','Categoria de risco',
                  'Deve encaminhar?','Encaminhada?','Origem','Status SISREG','Procedimento SISREG']
                  .map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap text-[11px] tracking-wide">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data?.rows?.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
              {data?.rows?.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-50 hover:bg-gov-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  <td className="px-3 py-2 font-bold text-gov-700 whitespace-nowrap">{row.ap ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700 max-w-[180px] truncate" title={row.unidade}>{row.unidade ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[120px] truncate" title={row.equipe}>{row.equipe ?? '-'}</td>
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.nome ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-600 text-center">{row.idade ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-600 text-center">{row.ig ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700 max-w-[200px]">
                    {row.categoria_risco ? (
                      <span className="inline-flex flex-wrap gap-0.5">
                        {row.categoria_risco.split('; ').map(c => (
                          <span key={c} className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
                            {c}
                          </span>
                        ))}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-center"><Badge value={row.deve_encaminhar} /></td>
                  <td className="px-3 py-2 text-center">
                    <EncBadge encaminhada={row.encaminhada} deve={row.deve_encaminhar} />
                  </td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{row.origem ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap max-w-[100px] truncate" title={row.status_sisreg}>{row.status_sisreg ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate" title={row.procedimento_sisreg}>{row.procedimento_sisreg ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] text-slate-500">
              Exibindo {((page - 1) * LIMIT) + 1}&ndash;{Math.min(page * LIMIT, totalRows)} de {totalRows.toLocaleString('pt-BR')} registros
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(1)} disabled={page === 1} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">&laquo;</button>
              <button onClick={() => goPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">&lsaquo;</button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p
                if (totalPages <= 7) { p = i + 1 }
                else if (page <= 4) { p = i + 1 }
                else if (page >= totalPages - 3) { p = totalPages - 6 + i }
                else { p = page - 3 + i }
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`w-7 h-7 text-[11px] rounded-lg border transition-colors ${p === page ? 'bg-slate-700 border-slate-700 text-white font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">&rsaquo;</button>
              <button onClick={() => goPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">&raquo;</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-100">
        <p>Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria) &middot; N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA) &middot; nucleoia.sap@gmail.com</p>
        <p>Vers&atilde;o 1</p>
      </div>
    </div>
  )
}
