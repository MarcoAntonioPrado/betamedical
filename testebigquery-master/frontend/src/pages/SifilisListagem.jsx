import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'

const LIMIT = 100

const CID_OPTIONS  = ['Todos', 'Sim', 'N\u00e3o']
const NOTI_OPTIONS = ['Todos', 'SIM', 'NOTIFICAR!']

const STATUS_COLOR = {
  'Cuidado Adequado (Gestante)':             'bg-emerald-100 text-emerald-700',
  'ACOMPANHAR: Tratamento em Curso':         'bg-amber-100 text-amber-700',
  'FALHA: Tratamento da Gestante Incompleto':'bg-rose-100 text-rose-700',
  'FALHA: Intervalo entre doses incorreto':  'bg-rose-100 text-rose-700',
  'PEND\u00caNCIA: Monitoramento de Cura':   'bg-violet-100 text-violet-700',
  'ALERTA: Tratamento sem Diagn\u00f3stico': 'bg-orange-100 text-orange-700',
}

function debounce(fn, delay) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

function fmtDate(v) {
  if (!v) return '\u2014'
  const s = typeof v === 'object' ? v.value : String(v)
  if (!s || s === 'null') return '\u2014'
  const [y, m, d] = s.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  if (!y || !m || !d) return s
  return `${d}/${months[parseInt(m,10)-1]}/${y.slice(2)}`
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-300 focus:border-gov-400 cursor-pointer truncate">
        <option value="">Todos</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</label>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gov-300 focus:border-gov-400" />
    </div>
  )
}

function StatusBadge({ value }) {
  const cls = STATUS_COLOR[value] ?? 'bg-slate-100 text-slate-500'
  const short = value
    ? value.replace('PEND\u00caNCIA:', 'PEND:').replace('ACOMPANHAR:', 'ACOMP:').replace('ALERTA:', 'ALERTA:').replace('FALHA:', 'FALHA:').replace('Cuidado Adequado (Gestante)', 'Adequado')
    : '\u2014'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold leading-tight ${cls}`}>{short}</span>
}

function NotiBadge({ value }) {
  if (value === 'SIM') return <span className="text-emerald-600 font-bold text-xs">SIM</span>
  return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white animate-pulse">NOTIFICAR!</span>
}

function DoseBadge({ status }) {
  const isAdequado = status === 'Completo (3+ doses)'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdequado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
      {isAdequado ? '\u2714' : '\u2718'} {isAdequado ? 'Adequado' : 'Inadequado'}
    </span>
  )
}

export default function SifilisListagem({ onBack }) {
  const [tab,   setTab]   = useState('todos')
  const [filters, setFilters] = useState({ ap:'', unidade:'', equipe:'', nome:'', cid_ativo:'', notificada:'', status_tx:'' })
  const [page,  setPage]  = useState(1)
  const [data,  setData]  = useState(null)
  const [filterOpts, setFilterOpts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableLoad, setTableLoad] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.sifilisListagemFilters()
      .then(setFilterOpts)
      .catch(e => setError(e.message))
  }, [])

  const fetchData = useCallback(async (f, p, t) => {
    setTableLoad(true)
    try {
      const params = { page: p, limit: LIMIT }
      if (f.ap)          params.ap        = f.ap
      if (f.unidade)     params.unidade   = f.unidade
      if (f.equipe)      params.equipe    = f.equipe
      if (f.nome)        params.nome      = f.nome
      if (f.cid_ativo && f.cid_ativo !== 'Todos')   params.cid_ativo  = f.cid_ativo
      if (f.notificada && f.notificada !== 'Todos')  params.notificada = f.notificada
      if (f.status_tx)   params.status_tx = f.status_tx
      if (t && t !== 'todos') params.tab  = t
      const result = await api.sifilisListagem(params)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setTableLoad(false)
    }
  }, [])

  const debouncedFetch = useRef(debounce((f, p, t) => fetchData(f, p, t), 500)).current

  useEffect(() => { fetchData(filters, 1, tab) }, []) // eslint-disable-line

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next); setPage(1)
    if (key === 'nome') debouncedFetch(next, 1, tab)
    else fetchData(next, 1, tab)
  }

  const changeTab = (t) => {
    setTab(t); setPage(1)
    fetchData(filters, 1, t)
  }

  const clearFilters = () => {
    const c = { ap:'', unidade:'', equipe:'', nome:'', cid_ativo:'', notificada:'', status_tx:'' }
    setFilters(c); setPage(1); setTab('todos')
    fetchData(c, 1, 'todos')
  }

  const goPage = (p) => { setPage(p); fetchData(filters, p, tab) }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-health-100 border-t-health-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando listagem...</p>
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

  const totalRows  = data?.total ?? 0
  const totalPages = data?.pages ?? 1

  return (
    <div className="space-y-4 pb-4">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gov-50 hover:bg-gov-100 text-gov-600 transition-colors border border-gov-200 text-lg font-bold">
            &#8592;
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Listagem Nominal de S&iacute;filis Gestacional</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria)</p>
          </div>
        </div>
        <div className="shrink-0 bg-gov-50 border border-gov-200 rounded-xl px-4 py-2.5 text-right">
          <p className="text-[10px] font-bold text-gov-500 uppercase tracking-widest">Total de Casos (n)</p>
          <p className="text-2xl font-black text-gov-700 leading-tight">{totalRows.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          <Select label="AP"      value={filters.ap}       onChange={v => updateFilter('ap', v)}      options={filterOpts?.aps ?? []} />
          <div className="col-span-2">
            <Select label="Unidade" value={filters.unidade}  onChange={v => updateFilter('unidade', v)} options={filterOpts?.unidades ?? []} />
          </div>
          <Select label="Equipe" value={filters.equipe}    onChange={v => updateFilter('equipe', v)}  options={filterOpts?.equipes ?? []} />
          <TextInput label="Nome" value={filters.nome}     onChange={v => updateFilter('nome', v)}    placeholder="Buscar..." />
          <Select label="CID ativo?" value={filters.cid_ativo} onChange={v => updateFilter('cid_ativo', v)} options={CID_OPTIONS} />
          <Select label="Notificada?" value={filters.notificada} onChange={v => updateFilter('notificada', v)} options={NOTI_OPTIONS} />
          <Select label="Status tratamento" value={filters.status_tx} onChange={v => updateFilter('status_tx', v)} options={filterOpts?.statusList ?? []} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={clearFilters}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg uppercase tracking-widest transition-colors">
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {[
          { key: 'todos',    label: 'Todos',            cls: 'bg-slate-100 text-slate-700 hover:bg-slate-200',  active: 'bg-slate-700 text-white' },
          { key: 'em-dia',   label: 'Em dia',           cls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', active: 'bg-emerald-600 text-white' },
          { key: 'janela',   label: 'Janela da dose',   cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100',   active: 'bg-amber-500 text-white' },
          { key: 'atrasado', label: 'Atrasado',         cls: 'bg-rose-50 text-rose-700 hover:bg-rose-100',      active: 'bg-rose-600 text-white' },
        ].map(t => (
          <button key={t.key} onClick={() => changeTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${tab === t.key ? t.active + ' border-transparent shadow-sm' : t.cls + ' border-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`overflow-x-auto ${tableLoad ? 'opacity-60 pointer-events-none' : ''} transition-opacity`}>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800 text-white">
                {['AP','Unidade','Equipe','Nome','IG','CID ativo?','Data diagn.','D1','D2','D3','DPP',
                  'VDRL diagn.','VDRL acomp.','Esquema parceria PEP','Notificada?','Status (Doses)','Status final']
                  .map(h => (
                    <th key={h} className="px-2.5 py-2.5 text-left font-semibold whitespace-nowrap text-[11px] tracking-wide">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data?.rows?.length === 0 && (
                <tr><td colSpan={17} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhum resultado encontrado.</td></tr>
              )}
              {data?.rows?.map((row, i) => (
                <tr key={i}
                  className={`border-b border-slate-50 hover:bg-gov-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                  <td className="px-2.5 py-2 font-bold text-rose-700 whitespace-nowrap">{row.ap ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 text-slate-700 max-w-[150px] truncate" title={row.unidade}>{row.unidade ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap max-w-[100px] truncate" title={row.equipe}>{row.equipe ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 font-medium text-slate-800 whitespace-nowrap">{row.nome ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 text-slate-600 text-center">{row.ig ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 text-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${row.cid_ativo === 'Sim' ? 'bg-emerald-500' : 'bg-slate-300'}`} title={row.cid_ativo ?? '\u2014'} />
                  </td>
                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap">{fmtDate(row.data_diagnostico)}</td>
                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap">{fmtDate(row.d1)}</td>
                  <td className={`px-2.5 py-2 whitespace-nowrap ${row.d2 ? 'text-slate-600' : 'bg-rose-50 text-rose-300'}`}>{fmtDate(row.d2)}</td>
                  <td className={`px-2.5 py-2 whitespace-nowrap ${row.d3 ? 'text-slate-600' : 'bg-rose-50 text-rose-300'}`}>{fmtDate(row.d3)}</td>
                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap">{fmtDate(row.dpp)}</td>
                  <td className="px-2.5 py-2 text-center">
                    {row.vdrl_diag
                      ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.vdrl_diag === 'Positivo' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{row.vdrl_diag}</span>
                      : <span className="text-slate-300">\u2014</span>}
                  </td>
                  <td className="px-2.5 py-2 text-center">
                    {row.vdrl_acomp
                      ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.vdrl_acomp === 'Positivo' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{row.vdrl_acomp}</span>
                      : <span className="text-slate-300">\u2014</span>}
                  </td>
                  <td className="px-2.5 py-2 text-slate-500 max-w-[140px] truncate text-[10px]" title={row.esquema_parceria}>{row.esquema_parceria ?? '\u2014'}</td>
                  <td className="px-2.5 py-2 text-center"><NotiBadge value={row.notificada} /></td>
                  <td className="px-2.5 py-2"><DoseBadge status={row.status_tx} /></td>
                  <td className="px-2.5 py-2"><StatusBadge value={row.status_final} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACAO */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] text-slate-500">
              {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, totalRows)} de {totalRows.toLocaleString('pt-BR')} registros
            </p>
            <div className="flex items-center gap-1">
              {[
                { label: '\u00ab', action: () => goPage(1),         disabled: page === 1 },
                { label: '\u2039', action: () => goPage(page-1),    disabled: page === 1 },
              ].map((b,i) => (
                <button key={i} onClick={b.action} disabled={b.disabled}
                  className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">{b.label}</button>
              ))}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p
                if (totalPages <= 7)        p = i + 1
                else if (page <= 4)         p = i + 1
                else if (page >= totalPages-3) p = totalPages - 6 + i
                else                        p = page - 3 + i
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`w-7 h-7 text-[11px] rounded-lg border transition-colors ${p === page ? 'bg-slate-700 border-slate-700 text-white font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}>
                    {p}
                  </button>
                )
              })}
              {[
                { label: '\u203a', action: () => goPage(page+1),       disabled: page === totalPages },
                { label: '\u00bb', action: () => goPage(totalPages),    disabled: page === totalPages },
              ].map((b,i) => (
                <button key={i} onClick={b.action} disabled={b.disabled}
                  className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-gov-50 hover:border-gov-200 transition-colors">{b.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RODAPE */}
      <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2 space-y-0.5">
        <p>Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria) &middot; N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA) &middot; nucleoia.sap@gmail.com</p>
        <p className="italic">*Para correta rela&ccedil;&atilde;o entre as bases, o nome e data de nascimento da gestante devem estar exatamente iguais no prontu&aacute;rio e no SINAN.</p>
      </div>
    </div>
  )
}
