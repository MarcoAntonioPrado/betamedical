import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'

const PER_PAGE = 100

function SimNao({ val, highlightNao = false }) {
  const yes = val === 1 || val === 'sim' || val === true
  if (highlightNao && !yes)
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">N&atilde;o</span>
  return yes
    ? <span className="text-xs text-emerald-700 font-medium">sim</span>
    : <span className="text-xs text-slate-400">n&atilde;o</span>
}

function PACell({ pas, pad }) {
  const grave = (Number(pas) > 160) || (Number(pad) > 110)
  if (!pas && !pad) return <span className="text-xs text-slate-400">-</span>
  return (
    <span className={`text-xs font-mono font-semibold ${grave ? 'text-rose-600' : 'text-slate-600'}`}>
      {pas ?? '-'}/{pad ?? '-'}
    </span>
  )
}

function RiscosBadge({ val }) {
  if (!val) return <span className="text-xs text-slate-300">-</span>
  return (
    <span className="inline-flex flex-wrap gap-0.5">
      {val.split('; ').map((r, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 leading-tight whitespace-nowrap">{r}</span>
      ))}
    </span>
  )
}

export default function GestantesListagem({ onBack }) {
  const [filters, setFilters] = useState({ aps: [], unidades: [], equipes: [], categorias: [] })
  const [ap, setAp] = useState('')
  const [unidade, setUnidade] = useState('')
  const [equipe, setEquipe] = useState('')
  const [nomeInput, setNomeInput] = useState('')
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [acidoFolico, setAcidoFolico] = useState('')
  const [carbonatoCa, setCarbonatoCa] = useState('')
  const [aas, setAas] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { api.gestantesListagemFilters().then(setFilters).catch(() => {}) }, [])

  useEffect(() => {
    const t = setTimeout(() => setNome(nomeInput), 400)
    return () => clearTimeout(t)
  }, [nomeInput])

  const fetchData = useCallback(() => {
    setLoading(true); setError(null)
    const params = { page, limit: PER_PAGE }
    if (ap)           params.ap = ap
    if (unidade)      params.unidade = unidade
    if (equipe)       params.equipe = equipe
    if (nome)         params.nome = nome
    if (categoria)    params.categoria = categoria
    if (acidoFolico)  params.acido_folico = acidoFolico
    if (carbonatoCa)  params.carbonato_calcio = carbonatoCa
    if (aas)          params.aas = aas
    api.gestantesListagem(params)
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, ap, unidade, equipe, nome, categoria, acidoFolico, carbonatoCa, aas])

  useEffect(() => { setPage(1) }, [ap, unidade, equipe, nome, categoria, acidoFolico, carbonatoCa, aas])
  useEffect(() => { fetchData() }, [fetchData])

  const clearAll = () => {
    setAp(''); setUnidade(''); setEquipe(''); setNomeInput(''); setNome('')
    setCategoria(''); setAcidoFolico(''); setCarbonatoCa(''); setAas('')
    setPage(1)
  }

  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PER_PAGE)
  const rows       = data?.rows ?? []
  const selCls     = 'h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-300 focus:border-gov-400'

  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors">
            &#8592; Voltar
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-800">Listagem Nominal de Gestantes</h2>
          <p className="text-xs text-slate-400 mt-0.5 italic">*Clique em uma gestante na tabela para ver os CNS.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-gov-50 border border-gov-200 rounded-xl px-5 py-2 text-center">
            <p className="text-[10px] text-gov-500 font-bold uppercase tracking-widest">Total de Casos (n)</p>
            <p className="text-2xl font-black text-gov-700 leading-none">{total.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AP</label>
            <select className={selCls} value={ap} onChange={e => setAp(e.target.value)}>
              <option value="">Todos</option>
              {filters.aps.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidade</label>
            <select className={`${selCls} w-48`} value={unidade} onChange={e => setUnidade(e.target.value)}>
              <option value="">Todos</option>
              {filters.unidades.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipe</label>
            <select className={`${selCls} w-32`} value={equipe} onChange={e => setEquipe(e.target.value)}>
              <option value="">Todos</option>
              {filters.equipes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome</label>
            <input type="text" placeholder="Buscar nome..." className={`${selCls} w-36`} value={nomeInput} onChange={e => setNomeInput(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria de Risco</label>
            <select className={`${selCls} w-40`} value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">Todos</option>
              {filters.categorias.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ca. C&aacute;lcio</label>
            <select className={selCls} value={carbonatoCa} onChange={e => setCarbonatoCa(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&Aacute;cido F&oacute;lico</label>
            <select className={selCls} value={acidoFolico} onChange={e => setAcidoFolico(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AAS</label>
            <select className={selCls} value={aas} onChange={e => setAas(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          <button onClick={clearAll} className="h-8 self-end px-4 rounded-lg text-xs font-bold border-2 border-rose-400 text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-wide">
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && <div className="p-12 flex justify-center"><Spinner /></div>}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  {['AP','Unidade','Equipe','Nome','Idade','IG','&Uacute;lt. consulta &gt;30d','Riscos &agrave; gesta&ccedil;&atilde;o','PAs m&aacute;x. / PAd m&aacute;x.','&Aacute;c. F&oacute;lico','Ca. C&aacute;lcio','AAS','N&ordm; VD ACS','N&ordm; consultas','N&ordm; consultas SB','Atd. emerg&ecirc;ncia'].map((h,i) => (
                    <th key={i} className="px-2.5 py-2.5 font-semibold text-[11px] text-left whitespace-nowrap" dangerouslySetInnerHTML={{ __html: h }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={16} className="text-center py-12 text-slate-400">Nenhum registro encontrado.</td></tr>
                )}
                {rows.map((r, i) => {
                  const atrasada = r.mais_de_30_sem_atd === 'sim'
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-rose-50/30' : 'bg-slate-50/60 hover:bg-rose-50/30'}>
                      <td className="px-2.5 py-2 text-slate-500 font-mono font-semibold">{r.ap}</td>
                      <td className="px-2.5 py-2 text-slate-700 max-w-[150px] truncate" title={r.unidade}>{r.unidade}</td>
                      <td className="px-2.5 py-2 text-slate-600 max-w-[100px] truncate" title={r.equipe}>{r.equipe}</td>
                      <td className="px-2.5 py-2 text-slate-800 font-medium max-w-[160px] truncate" title={r.nome}>{r.nome}</td>
                      <td className="px-2.5 py-2 text-center text-slate-600">{r.idade}</td>
                      <td className="px-2.5 py-2 text-center text-slate-600">{r.ig}</td>
                      <td className="px-2.5 py-2 text-center">
                        {atrasada
                          ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap">sim</span>
                          : <span className="text-xs text-slate-400">n&atilde;o</span>}
                      </td>
                      <td className="px-2.5 py-2 max-w-[200px]"><RiscosBadge val={r.categorias_risco} /></td>
                      <td className="px-2.5 py-2"><PACell pas={r.pas_max} pad={r.pad_max} /></td>
                      <td className="px-2.5 py-2"><SimNao val={r.prescricao_acido_folico} /></td>
                      <td className="px-2.5 py-2"><SimNao val={r.prescricao_carbonato_calcio} /></td>
                      <td className="px-2.5 py-2"><SimNao val={r.tem_prescricao_aas} highlightNao={!!r.tem_indicacao_aas} /></td>
                      <td className="px-2.5 py-2 text-center text-slate-600">{r.total_visitas_acs ?? 0}</td>
                      <td className="px-2.5 py-2 text-center text-slate-600">{r.total_consultas_prenatal ?? 0}</td>
                      <td className="px-2.5 py-2 text-center text-slate-600">{r.total_consultas_saude_bucal ?? 0}</td>
                      <td className="px-2.5 py-2 text-center">
                        {r.atd_emergencia === 'sim'
                          ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Sim</span>
                          : <span className="text-xs text-slate-400">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-500">
              Exibindo {(page - 1) * PER_PAGE + 1}&ndash;{Math.min(page * PER_PAGE, total)} de {total.toLocaleString('pt-BR')} registros
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">&laquo;</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">&lsaquo;</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2
                if (pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)} className={`px-2.5 py-1 text-xs rounded border transition-colors ${pg === page ? 'bg-slate-700 border-slate-700 text-white font-bold' : 'border-slate-200 hover:bg-slate-100'}`}>{pg}</button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">&rsaquo;</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">&raquo;</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-slate-400 text-center">
        N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA) &middot; nucleoia.sap@gmail.com &middot; Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria)
      </p>
    </div>
  )
}
