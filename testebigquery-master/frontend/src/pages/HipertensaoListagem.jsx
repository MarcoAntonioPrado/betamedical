import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'

function SimNao({ val, highlight = false }) {
  const yes = val === 1 || val === 'sim' || val === true
  if (highlight) {
    return yes
      ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">Sim</span>
      : <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">N&atilde;o</span>
  }
  return yes
    ? <span className="text-xs text-emerald-700 font-medium">sim</span>
    : <span className="text-xs text-slate-400">n&atilde;o</span>
}

function StatusBadge({ cid, provavel }) {
  if (cid > 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gov-100 text-gov-700 uppercase tracking-wide">CID Ativo</span>
  if (provavel === 1) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">Prov&aacute;vel HAS</span>
  return null
}

function PACell({ pas, pad }) {
  const grave = (Number(pas) > 160) || (Number(pad) > 110)
  return (
    <span className={`text-xs font-mono font-semibold ${grave ? 'text-rose-600' : 'text-slate-600'}`}>
      {pas ?? '-'}/{pad ?? '-'}
    </span>
  )
}

const PER_PAGE = 100

export default function HipertensaoListagem({ onBack }) {
  const [filters, setFilters] = useState({ aps: [], unidades: [], equipes: [] })
  const [ap, setAp] = useState('')
  const [unidade, setUnidade] = useState('')
  const [equipe, setEquipe] = useState('')
  const [nome, setNome] = useState('')
  const [nomeInput, setNomeInput] = useState('')
  const [statusHas, setStatusHas] = useState('')
  const [encaminhada, setEncaminhada] = useState('')
  const [prescricaoAas, setPrescricaoAas] = useState('')
  const [antiHipertensivo, setAntiHipertensivo] = useState('')
  const [aparelhoPa, setAparelhoPa] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.hasListagemFilters().then(setFilters).catch(() => {})
  }, [])

  // Debounce nome
  useEffect(() => {
    const t = setTimeout(() => setNome(nomeInput), 400)
    return () => clearTimeout(t)
  }, [nomeInput])

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = { page, limit: PER_PAGE }
    if (ap)               params.ap = ap
    if (unidade)          params.unidade = unidade
    if (equipe)           params.equipe = equipe
    if (nome)             params.nome = nome
    if (statusHas)        params.status_has = statusHas
    if (encaminhada)      params.encaminhada = encaminhada
    if (prescricaoAas)    params.prescricao_aas = prescricaoAas
    if (antiHipertensivo) params.anti_hipertensivo = antiHipertensivo
    if (aparelhoPa)       params.aparelho_pa = aparelhoPa
    api.hasListagem(params)
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, ap, unidade, equipe, nome, statusHas, encaminhada, prescricaoAas, antiHipertensivo, aparelhoPa])

  useEffect(() => { setPage(1) }, [ap, unidade, equipe, nome, statusHas, encaminhada, prescricaoAas, antiHipertensivo, aparelhoPa])
  useEffect(() => { fetchData() }, [fetchData])

  const clearAll = () => {
    setAp(''); setUnidade(''); setEquipe(''); setNomeInput(''); setNome('')
    setStatusHas(''); setEncaminhada(''); setPrescricaoAas(''); setAntiHipertensivo(''); setAparelhoPa('')
    setPage(1)
  }

  const total     = data?.total ?? 0
  const totalPages = Math.ceil(total / PER_PAGE)
  const rows      = data?.rows ?? []

  const selCls = 'h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-300'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
        >
          &#8592; Voltar
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Listagem Nominal &ndash; Gestantes Hipertensas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Fonte: PEP &middot; NIA</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-gov-50 border border-gov-200 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] text-gov-500 font-bold uppercase tracking-widest">Total de Casos (n)</p>
            <p className="text-2xl font-black text-gov-700 leading-none">{total.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-end">
          {/* AP */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AP</label>
            <select className={selCls} value={ap} onChange={e => setAp(e.target.value)}>
              <option value="">Todos</option>
              {filters.aps.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {/* Unidade */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidade</label>
            <select className={`${selCls} w-52`} value={unidade} onChange={e => setUnidade(e.target.value)}>
              <option value="">Todos</option>
              {filters.unidades.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {/* Equipe */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipe</label>
            <select className={`${selCls} w-36`} value={equipe} onChange={e => setEquipe(e.target.value)}>
              <option value="">Todos</option>
              {filters.equipes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {/* Nome */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome</label>
            <input
              type="text"
              placeholder="Buscar nome..."
              className={`${selCls} w-40`}
              value={nomeInput}
              onChange={e => setNomeInput(e.target.value)}
            />
          </div>
          {/* Status HAS */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status HAS</label>
            <select className={`${selCls} w-32`} value={statusHas} onChange={e => setStatusHas(e.target.value)}>
              <option value="">Todos</option>
              <option value="cid">CID Ativo</option>
              <option value="provavel">Prov&aacute;vel HAS</option>
            </select>
          </div>
          {/* Encaminhada */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encaminhada?</label>
            <select className={selCls} value={encaminhada} onChange={e => setEncaminhada(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          {/* Prescricao AAS */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescri&ccedil;&atilde;o AAS</label>
            <select className={selCls} value={prescricaoAas} onChange={e => setPrescricaoAas(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          {/* Anti-hipertensivo */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Antihipertensivo</label>
            <select className={selCls} value={antiHipertensivo} onChange={e => setAntiHipertensivo(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          {/* Aparelho PA */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aparelho PA</label>
            <select className={selCls} value={aparelhoPa} onChange={e => setAparelhoPa(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">N&atilde;o</option>
            </select>
          </div>
          {/* Clear */}
          <button
            onClick={clearAll}
            className="h-8 self-end px-4 rounded-lg text-xs font-bold border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 transition-colors uppercase tracking-wide"
          >
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
                  {['AP','Unidade','Equipe','Nome','Idade','IG','Status','Encaminhada?','Prescri&ccedil;&atilde;o AAS','Prescri&ccedil;&atilde;o Ca C&aacute;lcio','Prescri&ccedil;&atilde;o &Aacute;c. F&oacute;lico','Aparelho PA','PA grave','PAs m&aacute;x. / PAd m&aacute;x.','Anti-hipertensivo'].map((h,i) => (
                    <th key={i} className="px-2.5 py-2.5 font-semibold text-[11px] text-left whitespace-nowrap" dangerouslySetInnerHTML={{ __html: h }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={15} className="text-center py-12 text-slate-400">Nenhum registro encontrado.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="px-2.5 py-2 text-slate-500 font-mono font-semibold">{r.ap}</td>
                    <td className="px-2.5 py-2 text-slate-700 max-w-[160px] truncate" title={r.unidade}>{r.unidade}</td>
                    <td className="px-2.5 py-2 text-slate-600 max-w-[100px] truncate" title={r.equipe}>{r.equipe}</td>
                    <td className="px-2.5 py-2 text-slate-800 font-medium max-w-[160px] truncate" title={r.nome}>{r.nome}</td>
                    <td className="px-2.5 py-2 text-center text-slate-600">{r.idade}</td>
                    <td className="px-2.5 py-2 text-center text-slate-600">{r.ig}</td>
                    <td className="px-2.5 py-2"><StatusBadge cid={r.hipertensao_total} provavel={r.provavel_hipertensa_sem_diagnostico} /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.tem_encaminhamento_has} highlight /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.tem_prescricao_aas} highlight /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.prescricao_carbonato_calcio} /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.prescricao_acido_folico} /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.tem_aparelho_pa_dispensado} /></td>
                    <td className="px-2.5 py-2">
                      {r.teve_pa_grave === 1
                        ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">Sim</span>
                        : <span className="text-xs text-slate-400">N&atilde;o</span>}
                    </td>
                    <td className="px-2.5 py-2"><PACell pas={r.pas_max} pad={r.pad_max} /></td>
                    <td className="px-2.5 py-2"><SimNao val={r.tem_anti_hipertensivo} highlight /></td>
                  </tr>
                ))}
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
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors">&laquo;</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors">&lsaquo;</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg = page <= 3 ? i + 1 : page + i - 2
                if (pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)} className={`px-2.5 py-1 text-xs rounded border transition-colors ${pg === page ? 'bg-slate-700 border-slate-700 text-white font-bold' : 'border-slate-200 hover:bg-slate-100'}`}>{pg}</button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors">&rsaquo;</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors">&raquo;</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-slate-400 text-center pb-2">
        N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA) &middot; nucleoia.sap@gmail.com &middot; Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria)
      </p>
    </div>
  )
}
