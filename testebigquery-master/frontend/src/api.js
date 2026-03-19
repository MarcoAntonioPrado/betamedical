const BASE = import.meta.env.VITE_API_URL ?? ''

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erro HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  resumo:            () => get('/api/resumo'),
  faixaEtaria:       () => get('/api/faixa-etaria'),
  raca:              () => get('/api/raca'),
  faseAtual:         () => get('/api/fase-atual'),
  areaProgratica:    () => get('/api/area-programatica'),
  condicoesSaude:    () => get('/api/condicoes-saude'),
  categoriasRisco:   () => get('/api/categorias-risco'),
  evolucaoMensal:    () => get('/api/evolucao-mensal'),
  tipoParto:         () => get('/api/tipo-parto'),
  consultasPrenatal: () => get('/api/consultas-prenatal'),
  sifilis:           () => get('/api/sifilis'),
  adequacaoAas:      () => get('/api/adequacao-aas'),
  encaminhamentos:   () => get('/api/encaminhamentos'),
  motivosEmergencia: () => get('/api/motivos-emergencia'),
  overviewKpis:          () => get('/api/overview-kpis'),
  prescricoes:           () => get('/api/prescricoes'),
  saudeBucal:            () => get('/api/saude-bucal'),
  vacinaVsr:             () => get('/api/vacina-vsr'),
  trimestres:            () => get('/api/trimestres'),
  racaFaixaEtaria:       () => get('/api/raca-faixa-etaria'),
  sifilisKpis:           () => get('/api/sifilis-kpis'),
  sifilisTrimestreTx:    () => get('/api/sifilis-trimestre'),
  sifilisStatusTratamento: () => get('/api/sifilis-status-tratamento'),
  sifilisRaca:           () => get('/api/sifilis-raca'),
  sifilisAp:             () => get('/api/sifilis-ap'),
  hasKpis:               () => get('/api/has-kpis'),
  hasAp:                 () => get('/api/has-ap'),
  altoRiscoKpis:         () => get('/api/alto-risco-kpis'),
  altoRiscoFilters:      () => get('/api/alto-risco-filters'),
  altoRisco:             (params) => get('/api/alto-risco?' + new URLSearchParams(params).toString()),
  sifilisListagemFilters: () => get('/api/sifilis-listagem-filters'),
  sifilisListagem:        (params) => get('/api/sifilis-listagem?' + new URLSearchParams(params).toString()),
  hasListagemFilters:    () => get('/api/has-listagem-filters'),
  hasListagem:           (params) => get('/api/has-listagem?' + new URLSearchParams(params).toString()),
  gestantesListagemFilters: () => get('/api/gestantes-listagem-filters'),
  gestantesListagem:        (params) => get('/api/gestantes-listagem?' + new URLSearchParams(params).toString()),
}
