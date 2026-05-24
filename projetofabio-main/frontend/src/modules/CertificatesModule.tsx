import type { Certificado, MedicaoCalibracao, PadraoCalibracao, ResultadoSegurancaEletrica, TipoCertificado } from '@atlasmed/shared'
import { formatDate, TIPO_CERTIFICADO_LABELS, TIPO_CERTIFICADO_OPTIONS } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { usePrintCertificate } from '../components/PrintCertificate'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'

// --------------- helpers ---------------

function parseChecklist(source: string) {
  return source
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [nome, status, medicao] = l.split('|').map((p) => p.trim())
      return { nome, status: (status || 'ok') as 'ok' | 'nok' | 'conforme' | 'nao-conforme', medicao }
    })
}

function checklistToText(list: Certificado['checklist']) {
  return list.map((ch) => `${ch.nome} | ${ch.status} | ${ch.medicao ?? ''}`).join('\n')
}

const EMPTY_MEDICAO: MedicaoCalibracao = {
  pontoNominal: '',
  valorMedido: '',
  erroEncontrado: '',
  incerteza: '',
  tolerancia: '',
  resultado: 'Conforme',
}

const EMPTY_SEGURANCA: ResultadoSegurancaEletrica = {
  correnteFugaTerra: '',
  correnteFugaInvolucro: '',
  correnteFugaPaciente: '',
  resistenciaTerra: '',
  tensaoAplicada: '',
  isolacao: '',
  limiteCorrenteFuga: '',
  limiteResistenciaTerra: '',
  resultado: 'Aprovado',
}

interface CertForm {
  equipamentoId: string
  rotinaId: string
  padraoId: string
  funcionarioId: string
  tecnicoNome: string
  tecnicoRegistro: string
  tipo: TipoCertificado
  data: string
  proximaData: string
  statusGeral: 'aprovado' | 'reprovado' | 'em-andamento'
  conclusaoTecnica: string
  recomendacoes: string
  observacoes: string
  checklistText: string
  medicoes: MedicaoCalibracao[]
  tempCal: string
  umidCal: string
  pressaoCal: string
  tensaoCal: string
  seguranca: ResultadoSegurancaEletrica
}

const newCertForm = (): CertForm => ({
  equipamentoId: '',
  rotinaId: '',
  padraoId: '',
  funcionarioId: '',
  tecnicoNome: '',
  tecnicoRegistro: '',
  tipo: 'preventiva',
  data: new Date().toISOString().slice(0, 10),
  proximaData: '',
  statusGeral: 'aprovado',
  conclusaoTecnica: '',
  recomendacoes: '',
  observacoes: '',
  checklistText: '',
  medicoes: [{ ...EMPTY_MEDICAO }],
  tempCal: '',
  umidCal: '',
  pressaoCal: '',
  tensaoCal: '',
  seguranca: { ...EMPTY_SEGURANCA },
})

interface PadraoForm {
  nome: string
  tipo: string
  numeroSerie: string
  fabricante: string
  dataCalibracao: string
  validadeCalibracao: string
  responsavel: string
  observacoes: string
}

const newPadraoForm = (): PadraoForm => ({
  nome: '',
  tipo: '',
  numeroSerie: '',
  fabricante: '',
  dataCalibracao: new Date().toISOString().slice(0, 10),
  validadeCalibracao: '',
  responsavel: '',
  observacoes: '',
})

// --------------- component ---------------

export function CertificatesModule() {
  const { collections, ensureCollections, saveRecord, deleteRecord } = useAppData()
  const { showNotice } = useUi()
  const printCertificate = usePrintCertificate()

  const [tab, setTab] = useState<'certificados' | 'rotinas' | 'padroes'>('certificados')

  const [certSearch, setCertSearch] = useState('')
  const [routineSearch, setRoutineSearch] = useState('')
  const [padraoSearch, setPadraoSearch] = useState('')

  const [certOpen, setCertOpen] = useState(false)
  const [routineOpen, setRoutineOpen] = useState(false)
  const [padraoOpen, setPadraoOpen] = useState(false)

  const [editingCert, setEditingCert] = useState<Certificado | null>(null)
  const [editingRoutine, setEditingRoutine] = useState<Record<string, unknown> | null>(null)
  const [editingPadrao, setEditingPadrao] = useState<PadraoCalibracao | null>(null)

  const [certForm, setCertForm] = useState<CertForm>(newCertForm)
  const [routineForm, setRoutineForm] = useState({ nome: '', tipo: 'preventiva' as TipoCertificado, equipamentoTipo: '', descricao: '', criteriosAprovacao: '', ativo: true, camposText: '' })
  const [padraoForm, setPadraoForm] = useState<PadraoForm>(newPadraoForm)

  const { viewMode: certViewMode, setViewMode: setCertViewMode } = useModuleViewMode('certs:emitidos')
  const { viewMode: routineViewMode, setViewMode: setRoutineViewMode } = useModuleViewMode('certs:rotinas')

  useEffect(() => {
    void ensureCollections(['certificados', 'rotinasCertificacao', 'padroesCalibracao', 'equipamentos', 'funcionarios', 'clientes'])
  }, [ensureCollections])

  const certificates = (collections.certificados ?? []) as Certificado[]
  const routines = collections.rotinasCertificacao ?? []
  const equipments = collections.equipamentos ?? []
  const patterns = (collections.padroesCalibracao ?? []) as PadraoCalibracao[]
  const staff = collections.funcionarios ?? []

  const approvedCount = useMemo(() => certificates.filter((c) => c.statusGeral === 'aprovado').length, [certificates])
  const pendingCount = useMemo(() => certificates.filter((c) => c.statusGeral === 'em-andamento').length, [certificates])

  const filteredCerts = useMemo(
    () =>
      certificates.filter(
        (c) =>
          !certSearch ||
          `${c.id} ${c.numeroCertificado ?? ''} ${c.equipamentoNome} ${c.equipamentoTag ?? ''} ${c.tecnicoNome} ${c.tipo}`.toLowerCase().includes(certSearch.toLowerCase()),
      ),
    [certSearch, certificates],
  )
  const filteredRoutines = useMemo(
    () => routines.filter((r) => !routineSearch || `${r.nome} ${r.tipo} ${r.equipamentoTipo}`.toLowerCase().includes(routineSearch.toLowerCase())),
    [routineSearch, routines],
  )
  const filteredPadroes = useMemo(
    () => patterns.filter((p) => !padraoSearch || `${p.nome} ${p.tipo} ${p.numeroSerie}`.toLowerCase().includes(padraoSearch.toLowerCase())),
    [padraoSearch, patterns],
  )

  function openNewCert() {
    setEditingCert(null)
    setCertForm(newCertForm())
    setCertOpen(true)
  }

  function openEditCert(cert: Certificado) {
    setEditingCert(cert)
    const techEmployee = staff.find((s) => s.nome === cert.tecnicoNome)
    setCertForm({
      equipamentoId: cert.equipamentoId,
      rotinaId: cert.rotinaId ?? '',
      padraoId: cert.padraoId ?? '',
      funcionarioId: techEmployee?.id ?? '',
      tecnicoNome: cert.tecnicoNome,
      tecnicoRegistro: cert.tecnicoRegistro ?? '',
      tipo: cert.tipo,
      data: cert.data,
      proximaData: cert.proximaData ?? '',
      statusGeral: cert.statusGeral,
      conclusaoTecnica: cert.conclusaoTecnica ?? '',
      recomendacoes: cert.recomendacoes ?? '',
      observacoes: cert.observacoes ?? '',
      checklistText: checklistToText(cert.checklist ?? []),
      medicoes: cert.medicoes && cert.medicoes.length > 0 ? cert.medicoes.map((m) => ({ ...m })) : [{ ...EMPTY_MEDICAO }],
      tempCal: cert.condicoesAmbientais?.temperatura ?? '',
      umidCal: cert.condicoesAmbientais?.umidade ?? '',
      pressaoCal: cert.condicoesAmbientais?.pressao ?? '',
      tensaoCal: cert.condicoesAmbientais?.tensaoRede ?? '',
      seguranca: cert.segurancaEletrica ? { ...EMPTY_SEGURANCA, ...cert.segurancaEletrica } : { ...EMPTY_SEGURANCA },
    })
    setCertOpen(true)
  }

  function setCertF<K extends keyof CertForm>(key: K, value: CertForm[K]) {
    setCertForm((prev) => ({ ...prev, [key]: value }))
  }

  function setSegF<K extends keyof ResultadoSegurancaEletrica>(key: K, value: ResultadoSegurancaEletrica[K]) {
    setCertForm((prev) => ({ ...prev, seguranca: { ...prev.seguranca, [key]: value } }))
  }

  function addMedicaoRow() {
    setCertForm((prev) => ({ ...prev, medicoes: [...prev.medicoes, { ...EMPTY_MEDICAO }] }))
  }

  function removeMedicaoRow(index: number) {
    setCertForm((prev) => ({ ...prev, medicoes: prev.medicoes.filter((_, i) => i !== index) }))
  }

  function updateMedicao(index: number, key: keyof MedicaoCalibracao, value: string) {
    setCertForm((prev) => {
      const updated = prev.medicoes.map((m, i) => (i === index ? { ...m, [key]: value } : m))
      return { ...prev, medicoes: updated }
    })
  }

  async function saveCert(event: React.FormEvent) {
    event.preventDefault()
    try {
      const eq = equipments.find((e) => e.id === certForm.equipamentoId)
      const routine = routines.find((r) => r.id === certForm.rotinaId)
      const pattern = patterns.find((p) => p.id === certForm.padraoId)
      const staffMember = staff.find((s) => s.id === certForm.funcionarioId)
      const tecnico = staffMember?.nome ?? certForm.tecnicoNome

      const hasCondicoes = certForm.tempCal || certForm.umidCal || certForm.pressaoCal || certForm.tensaoCal
      const condicoesAmbientais = hasCondicoes
        ? { temperatura: certForm.tempCal || undefined, umidade: certForm.umidCal || undefined, pressao: certForm.pressaoCal || undefined, tensaoRede: certForm.tensaoCal || undefined }
        : undefined

      const medicoes = certForm.tipo === 'calibracao' && certForm.medicoes.some((m) => m.pontoNominal) ? certForm.medicoes.filter((m) => m.pontoNominal) : undefined

      const segurancaEletrica =
        certForm.tipo === 'seguranca-eletrica' && (certForm.seguranca.correnteFugaTerra || certForm.seguranca.resistenciaTerra) ? certForm.seguranca : undefined

      await saveRecord('certificados', {
        id: editingCert?.id as string | undefined,
        equipamentoId: certForm.equipamentoId,
        equipamentoNome: eq?.nome ?? '',
        equipamentoNumeroSerie: eq?.numeroSerie ?? '',
        equipamentoTag: eq?.tag,
        equipamentoPatrimonio: eq?.numeroPatrimonio,
        rotinaId: certForm.rotinaId || undefined,
        rotinaNome: routine?.nome,
        padraoId: certForm.padraoId || undefined,
        padraoNome: pattern?.nome,
        clienteId: eq?.clienteId,
        clienteNome: eq?.hospital ?? collections.clientes?.find((c) => c.id === eq?.clienteId)?.nome,
        tecnicoNome: tecnico,
        tecnicoRegistro: certForm.tecnicoRegistro || undefined,
        tipo: certForm.tipo as never,
        data: certForm.data,
        proximaData: certForm.proximaData || undefined,
        statusGeral: certForm.statusGeral as never,
        conclusaoTecnica: certForm.conclusaoTecnica || undefined,
        recomendacoes: certForm.recomendacoes || undefined,
        observacoes: certForm.observacoes || undefined,
        checklist: parseChecklist(certForm.checklistText),
        medicoes,
        segurancaEletrica,
        condicoesAmbientais,
        versao: (editingCert?.versao ?? 0) + 1,
      } as never)

      showNotice({ tone: 'success', title: 'Certificado salvo', message: 'O registro técnico foi emitido com sucesso.' })
      setCertOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  function openNewRoutine() {
    setEditingRoutine(null)
    setRoutineForm({ nome: '', tipo: 'preventiva', equipamentoTipo: '', descricao: '', criteriosAprovacao: '', ativo: true, camposText: '' })
    setRoutineOpen(true)
  }

  async function saveRoutine(event: React.FormEvent) {
    event.preventDefault()
    try {
      const campos = routineForm.camposText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => { const [nome, referencia, unidade] = l.split('|').map((p) => p.trim()); return { nome, referencia, unidade } })
      await saveRecord('rotinasCertificacao', {
        id: editingRoutine?.id as string | undefined,
        nome: routineForm.nome, tipo: routineForm.tipo as never,
        equipamentoTipo: routineForm.equipamentoTipo,
        descricao: routineForm.descricao || undefined,
        criteriosAprovacao: routineForm.criteriosAprovacao || undefined,
        ativo: routineForm.ativo, campos,
      } as never)
      showNotice({ tone: 'success', title: 'Rotina salva', message: 'A rotina técnica foi atualizada.' })
      setRoutineOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Erro', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  function openNewPadrao() {
    setEditingPadrao(null)
    setPadraoForm(newPadraoForm())
    setPadraoOpen(true)
  }

  function openEditPadrao(padrao: PadraoCalibracao) {
    setEditingPadrao(padrao)
    setPadraoForm({ nome: padrao.nome, tipo: padrao.tipo, numeroSerie: padrao.numeroSerie, fabricante: padrao.fabricante ?? '', dataCalibracao: padrao.dataCalibracao, validadeCalibracao: padrao.validadeCalibracao, responsavel: padrao.responsavel ?? '', observacoes: padrao.observacoes ?? '' })
    setPadraoOpen(true)
  }

  async function savePadrao(event: React.FormEvent) {
    event.preventDefault()
    try {
      const valid = new Date(padraoForm.validadeCalibracao)
      const status = valid < new Date() ? ('Vencido' as const) : valid < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? ('Vencendo' as const) : ('Vigente' as const)
      await saveRecord('padroesCalibracao', {
        id: editingPadrao?.id as string | undefined,
        nome: padraoForm.nome, tipo: padraoForm.tipo, numeroSerie: padraoForm.numeroSerie,
        fabricante: padraoForm.fabricante || undefined, dataCalibracao: padraoForm.dataCalibracao,
        validadeCalibracao: padraoForm.validadeCalibracao, responsavel: padraoForm.responsavel || undefined,
        status, observacoes: padraoForm.observacoes || undefined,
      } as never)
      showNotice({ tone: 'success', title: 'Padrão salvo', message: 'O padrão de calibração foi atualizado.' })
      setPadraoOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Erro', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  function handlePrint(cert: Certificado) {
    const eq = equipments.find((e) => e.id === cert.equipamentoId) as never
    const padrao = patterns.find((p) => p.id === cert.padraoId)
    printCertificate({ cert, equipment: eq, padrao })
  }

  return (
    <section className="module-card">
      <div className="summary-grid compact">
        <article className="metric-card"><span>Certificados emitidos</span><strong>{certificates.length}</strong></article>
        <article className="metric-card success"><span>Aprovados</span><strong>{approvedCount}</strong></article>
        <article className="metric-card warning"><span>Em andamento</span><strong>{pendingCount}</strong></article>
        <article className="metric-card"><span>Rotinas</span><strong>{routines.length}</strong></article>
        <article className="metric-card"><span>Padrões</span><strong>{patterns.length}</strong></article>
      </div>

      <div className="segmented-switch tab-switch">
        <button type="button" className={tab === 'certificados' ? 'switch-option active' : 'switch-option'} onClick={() => setTab('certificados')}>Certificados</button>
        <button type="button" className={tab === 'rotinas' ? 'switch-option active' : 'switch-option'} onClick={() => setTab('rotinas')}>Rotinas</button>
        <button type="button" className={tab === 'padroes' ? 'switch-option active' : 'switch-option'} onClick={() => setTab('padroes')}>Padrões</button>
      </div>

      {tab === 'certificados' && (
        <>
          <div className="section-heading">
            <div><p className="eyebrow">Emissão</p><h3>Registros técnicos</h3></div>
            <div className="module-toolbar-actions">
              <SearchField value={certSearch} onChange={setCertSearch} placeholder="Buscar por registro, TAG, equipamento..." total={filteredCerts.length} />
              <ViewModeToggle value={certViewMode} onChange={setCertViewMode} />
              <button className="primary-button" type="button" onClick={openNewCert}>Novo certificado</button>
            </div>
          </div>
          {filteredCerts.length === 0 && <div className="empty-state">Nenhum certificado encontrado.</div>}
          {filteredCerts.length > 0 && certViewMode === 'list' && (
            <div className="table-shell">
              <div className="table-head" style={{ gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 1fr 0.8fr auto' }}>
                <span>Certificado</span><span>Equipamento</span><span>Tipo</span><span>Data</span><span>Técnico</span><span>Status</span><span>Ações</span>
              </div>
              {filteredCerts.map((item) => (
                <div key={item.id} className="table-row" style={{ gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 1fr 0.8fr auto' }}>
                  <span className="monospace">{item.numeroCertificado ?? item.id}</span>
                  <span>{item.equipamentoNome}{item.equipamentoTag ? <small style={{ marginLeft: 4, opacity: 0.6 }}>[{item.equipamentoTag}]</small> : null}</span>
                  <span>{TIPO_CERTIFICADO_LABELS[item.tipo] ?? item.tipo}</span>
                  <span>{formatDate(item.data)}</span>
                  <span>{item.tecnicoNome}</span>
                  <StatusPill label={item.statusGeral} />
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => openEditCert(item)}>Editar</button>
                    <button className="ghost-button" type="button" onClick={() => handlePrint(item)}>PDF</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('certificados', item.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredCerts.length > 0 && certViewMode === 'grid' && (
            <div className="record-grid">
              {filteredCerts.map((item) => (
                <article key={item.id} className="record-card">
                  <div className="record-card-head">
                    <div>
                      <p className="record-kicker">{TIPO_CERTIFICADO_LABELS[item.tipo] ?? item.tipo}</p>
                      <h3>{item.equipamentoNome}</h3>
                      <p className="record-support">{item.numeroCertificado ?? item.id} · {item.tecnicoNome}</p>
                    </div>
                    <StatusPill label={item.statusGeral} />
                  </div>
                  <div className="record-card-grid">
                    <div className="record-stat"><span>Data</span><strong>{formatDate(item.data)}</strong></div>
                    {item.proximaData && <div className="record-stat"><span>Próxima</span><strong>{formatDate(item.proximaData)}</strong></div>}
                    {item.equipamentoTag && <div className="record-stat"><span>TAG</span><strong>{item.equipamentoTag}</strong></div>}
                  </div>
                  <div className="record-card-actions">
                    <button className="ghost-button" type="button" onClick={() => openEditCert(item)}>Editar</button>
                    <button className="ghost-button" type="button" onClick={() => handlePrint(item)}>Gerar PDF</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('certificados', item.id)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'rotinas' && (
        <>
          <div className="section-heading">
            <div><p className="eyebrow">Base técnica</p><h3>Rotinas cadastradas</h3></div>
            <div className="module-toolbar-actions">
              <SearchField value={routineSearch} onChange={setRoutineSearch} placeholder="Buscar por rotina, tipo..." total={filteredRoutines.length} />
              <ViewModeToggle value={routineViewMode} onChange={setRoutineViewMode} />
              <button className="primary-button" type="button" onClick={openNewRoutine}>Nova rotina</button>
            </div>
          </div>
          {filteredRoutines.length === 0 && <div className="empty-state">Nenhuma rotina encontrada.</div>}
          {filteredRoutines.length > 0 && routineViewMode === 'list' && (
            <div className="table-shell">
              <div className="table-head table-row-grid">
                <span>Nome</span><span>Tipo</span><span>Equipamento</span><span>Campos</span><span>Etapas</span><span>Ativo</span><span>Ações</span>
              </div>
              {filteredRoutines.map((routine) => (
                <div key={routine.id} className="table-row table-row-grid">
                  <span>{routine.nome}</span>
                  <span>{TIPO_CERTIFICADO_LABELS[routine.tipo] ?? routine.tipo}</span>
                  <span>{routine.equipamentoTipo}</span>
                  <span>{routine.campos.length}</span>
                  <span>{routine.etapas?.length ?? 0}</span>
                  <span>{routine.ativo !== false ? 'Sim' : 'Não'}</span>
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingRoutine(routine as unknown as Record<string, unknown>)
                      setRoutineForm({ nome: routine.nome, tipo: routine.tipo as TipoCertificado, equipamentoTipo: routine.equipamentoTipo, descricao: (routine as never as { descricao?: string }).descricao ?? '', criteriosAprovacao: (routine as never as { criteriosAprovacao?: string }).criteriosAprovacao ?? '', ativo: routine.ativo !== false, camposText: routine.campos.map((f) => `${f.nome} | ${f.referencia ?? ''} | ${f.unidade ?? ''}`).join('\n') })
                      setRoutineOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('rotinasCertificacao', routine.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredRoutines.length > 0 && routineViewMode === 'grid' && (
            <div className="record-grid">
              {filteredRoutines.map((routine) => (
                <article key={routine.id} className="record-card">
                  <div className="record-card-head">
                    <div>
                      <p className="record-kicker">{TIPO_CERTIFICADO_LABELS[routine.tipo] ?? routine.tipo}</p>
                      <h3>{routine.nome}</h3>
                      <p className="record-support">{routine.equipamentoTipo}</p>
                    </div>
                    <span className="record-identity">{routine.ativo !== false ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <div className="record-card-grid">
                    <div className="record-stat"><span>Campos</span><strong>{routine.campos.length}</strong></div>
                    <div className="record-stat"><span>Etapas</span><strong>{routine.etapas?.length ?? 0}</strong></div>
                  </div>
                  <div className="record-card-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingRoutine(routine as unknown as Record<string, unknown>)
                      setRoutineForm({ nome: routine.nome, tipo: routine.tipo as TipoCertificado, equipamentoTipo: routine.equipamentoTipo, descricao: (routine as never as { descricao?: string }).descricao ?? '', criteriosAprovacao: (routine as never as { criteriosAprovacao?: string }).criteriosAprovacao ?? '', ativo: routine.ativo !== false, camposText: routine.campos.map((f) => `${f.nome} | ${f.referencia ?? ''} | ${f.unidade ?? ''}`).join('\n') })
                      setRoutineOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('rotinasCertificacao', routine.id)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'padroes' && (
        <>
          <div className="section-heading">
            <div><p className="eyebrow">Rastreabilidade</p><h3>Padrões de calibração</h3></div>
            <div className="module-toolbar-actions">
              <SearchField value={padraoSearch} onChange={setPadraoSearch} placeholder="Buscar por nome, tipo ou série..." total={filteredPadroes.length} />
              <button className="primary-button" type="button" onClick={openNewPadrao}>Novo padrão</button>
            </div>
          </div>
          {filteredPadroes.length === 0 && <div className="empty-state">Nenhum padrão de calibração cadastrado.</div>}
          {filteredPadroes.length > 0 && (
            <div className="table-shell">
              <div className="table-head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr auto' }}>
                <span>Nome</span><span>Tipo</span><span>Nº Série</span><span>Calibrado em</span><span>Validade</span><span>Status</span><span>Ações</span>
              </div>
              {filteredPadroes.map((padrao) => (
                <div key={padrao.id} className="table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr auto' }}>
                  <span><strong>{padrao.nome}</strong>{padrao.fabricante && <small style={{ marginLeft: 4, opacity: 0.6 }}>{padrao.fabricante}</small>}</span>
                  <span>{padrao.tipo}</span>
                  <span className="monospace">{padrao.numeroSerie}</span>
                  <span>{formatDate(padrao.dataCalibracao)}</span>
                  <span>{formatDate(padrao.validadeCalibracao)}</span>
                  <StatusPill label={padrao.status} />
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => openEditPadrao(padrao)}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('padroesCalibracao', padrao.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CERTIFICATE MODAL */}
      <Modal open={certOpen} title={editingCert ? 'Editar certificado' : 'Novo certificado técnico'} onClose={() => setCertOpen(false)}>
        <form className="editor-form" onSubmit={saveCert}>
          <div className="field-grid">
            <label className="field-group">
              <span>Equipamento *</span>
              <select required value={certForm.equipamentoId} onChange={(e) => setCertF('equipamentoId', e.target.value)}>
                <option value="">Selecione</option>
                {equipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.nome} {eq.tag ? `[${eq.tag}]` : ''} — {eq.numeroSerie}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Tipo de certificado *</span>
              <select required value={certForm.tipo} onChange={(e) => setCertF('tipo', e.target.value as TipoCertificado)}>
                {TIPO_CERTIFICADO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Técnico responsável</span>
              <select value={certForm.funcionarioId} onChange={(e) => { const m = staff.find((s) => s.id === e.target.value); setCertForm((prev) => ({ ...prev, funcionarioId: e.target.value, tecnicoNome: m?.nome ?? prev.tecnicoNome })) }}>
                <option value="">Selecione ou preencha abaixo</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Nome do técnico</span>
              <input value={certForm.tecnicoNome} onChange={(e) => setCertF('tecnicoNome', e.target.value)} placeholder="Preenchido automaticamente" />
            </label>
            <label className="field-group">
              <span>Registro profissional (CREA/CRBM)</span>
              <input value={certForm.tecnicoRegistro} onChange={(e) => setCertF('tecnicoRegistro', e.target.value)} placeholder="Ex.: CRBM-SP 12345" />
            </label>
            <label className="field-group">
              <span>Rotina técnica</span>
              <select value={certForm.rotinaId} onChange={(e) => setCertF('rotinaId', e.target.value)}>
                <option value="">Nenhuma</option>
                {routines.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Padrão de calibração</span>
              <select value={certForm.padraoId} onChange={(e) => setCertF('padraoId', e.target.value)}>
                <option value="">Nenhum</option>
                {patterns.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.numeroSerie}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Data do certificado *</span>
              <input type="date" required value={certForm.data} onChange={(e) => setCertF('data', e.target.value)} />
            </label>
            <label className="field-group">
              <span>Próxima data programada</span>
              <input type="date" value={certForm.proximaData} onChange={(e) => setCertF('proximaData', e.target.value)} />
            </label>
            <label className="field-group">
              <span>Status geral</span>
              <select value={certForm.statusGeral} onChange={(e) => setCertF('statusGeral', e.target.value as CertForm['statusGeral'])}>
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
                <option value="em-andamento">Em andamento</option>
              </select>
            </label>

            <div className="field-group full" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condições ambientais</span>
            </div>
            <label className="field-group"><span>Temperatura</span><input value={certForm.tempCal} onChange={(e) => setCertF('tempCal', e.target.value)} placeholder="Ex.: 22°C" /></label>
            <label className="field-group"><span>Umidade relativa</span><input value={certForm.umidCal} onChange={(e) => setCertF('umidCal', e.target.value)} placeholder="Ex.: 55%" /></label>
            <label className="field-group"><span>Tensão de rede</span><input value={certForm.tensaoCal} onChange={(e) => setCertF('tensaoCal', e.target.value)} placeholder="127V ou 220V" /></label>
            <label className="field-group"><span>Pressão atmosférica</span><input value={certForm.pressaoCal} onChange={(e) => setCertF('pressaoCal', e.target.value)} placeholder="Ex.: 1013 hPa" /></label>

            {certForm.tipo === 'calibracao' && (
              <div className="field-group full">
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tabela de medições</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        {['Ponto nominal', 'Valor medido', 'Erro', 'Incerteza', 'Tolerância', 'Resultado', ''].map((h, i) => (
                          <th key={i} style={{ padding: '4px 6px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {certForm.medicoes.map((m, i) => (
                        <tr key={i}>
                          <td style={{ padding: 2 }}><input style={{ width: '100%', minWidth: 80 }} value={m.pontoNominal} onChange={(e) => updateMedicao(i, 'pontoNominal', e.target.value)} placeholder="100 ml/h" /></td>
                          <td style={{ padding: 2 }}><input style={{ width: '100%', minWidth: 80 }} value={m.valorMedido} onChange={(e) => updateMedicao(i, 'valorMedido', e.target.value)} placeholder="99.5 ml/h" /></td>
                          <td style={{ padding: 2 }}><input style={{ width: '100%', minWidth: 60 }} value={m.erroEncontrado ?? ''} onChange={(e) => updateMedicao(i, 'erroEncontrado', e.target.value)} placeholder="-0.5%" /></td>
                          <td style={{ padding: 2 }}><input style={{ width: '100%', minWidth: 60 }} value={m.incerteza ?? ''} onChange={(e) => updateMedicao(i, 'incerteza', e.target.value)} placeholder="±0.3%" /></td>
                          <td style={{ padding: 2 }}><input style={{ width: '100%', minWidth: 60 }} value={m.tolerancia ?? ''} onChange={(e) => updateMedicao(i, 'tolerancia', e.target.value)} placeholder="±5%" /></td>
                          <td style={{ padding: 2 }}>
                            <select style={{ width: '100%' }} value={m.resultado} onChange={(e) => updateMedicao(i, 'resultado', e.target.value as 'Conforme' | 'Não Conforme')}>
                              <option value="Conforme">Conforme</option>
                              <option value="Não Conforme">Não Conforme</option>
                            </select>
                          </td>
                          <td style={{ padding: 2 }}>
                            <button type="button" className="ghost-button danger" style={{ padding: '2px 8px' }} onClick={() => removeMedicaoRow(i)} disabled={certForm.medicoes.length === 1}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="ghost-button" style={{ marginTop: 6, fontSize: '0.8rem' }} onClick={addMedicaoRow}>+ Adicionar linha</button>
                </div>
              </div>
            )}

            {certForm.tipo === 'seguranca-eletrica' && (
              <>
                <div className="field-group full" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segurança elétrica (NBR IEC 60601-1)</span>
                </div>
                <label className="field-group"><span>Corrente de fuga à terra (mA)</span><input value={certForm.seguranca.correnteFugaTerra ?? ''} onChange={(e) => setSegF('correnteFugaTerra', e.target.value)} placeholder="0.08 mA" /></label>
                <label className="field-group"><span>Corrente de fuga no invólucro (mA)</span><input value={certForm.seguranca.correnteFugaInvolucro ?? ''} onChange={(e) => setSegF('correnteFugaInvolucro', e.target.value)} placeholder="0.05 mA" /></label>
                <label className="field-group"><span>Corrente de fuga no paciente (mA)</span><input value={certForm.seguranca.correnteFugaPaciente ?? ''} onChange={(e) => setSegF('correnteFugaPaciente', e.target.value)} placeholder="0.008 mA" /></label>
                <label className="field-group"><span>Resistência de aterramento (Ω)</span><input value={certForm.seguranca.resistenciaTerra ?? ''} onChange={(e) => setSegF('resistenciaTerra', e.target.value)} placeholder="0.09 Ω" /></label>
                <label className="field-group"><span>Tensão aplicada (rigidez dielétrica)</span><input value={certForm.seguranca.tensaoAplicada ?? ''} onChange={(e) => setSegF('tensaoAplicada', e.target.value)} placeholder="1500 V" /></label>
                <label className="field-group"><span>Resistência de isolação</span><input value={certForm.seguranca.isolacao ?? ''} onChange={(e) => setSegF('isolacao', e.target.value)} placeholder="> 100 MΩ" /></label>
                <label className="field-group"><span>Limite de corrente de fuga</span><input value={certForm.seguranca.limiteCorrenteFuga ?? ''} onChange={(e) => setSegF('limiteCorrenteFuga', e.target.value)} placeholder="0.5 mA (terra)" /></label>
                <label className="field-group"><span>Limite resistência de terra</span><input value={certForm.seguranca.limiteResistenciaTerra ?? ''} onChange={(e) => setSegF('limiteResistenciaTerra', e.target.value)} placeholder="0.2 Ω" /></label>
                <label className="field-group">
                  <span>Resultado dos testes elétricos</span>
                  <select value={certForm.seguranca.resultado} onChange={(e) => setSegF('resultado', e.target.value as 'Aprovado' | 'Reprovado')}>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Reprovado">Reprovado</option>
                  </select>
                </label>
              </>
            )}

            <label className="field-group full">
              <span>Checklist de verificação</span>
              <textarea rows={6} value={certForm.checklistText} onChange={(e) => setCertF('checklistText', e.target.value)} placeholder={'Item | ok/nok/conforme/nao-conforme | medição\nEx.: Alarmes audiovisuais | ok | Todos funcionais'} />
            </label>
            <label className="field-group full">
              <span>Conclusão técnica</span>
              <textarea rows={3} value={certForm.conclusaoTecnica} onChange={(e) => setCertF('conclusaoTecnica', e.target.value)} placeholder="Descreva a conclusão técnica do serviço." />
            </label>
            <label className="field-group full">
              <span>Recomendações</span>
              <textarea rows={2} value={certForm.recomendacoes} onChange={(e) => setCertF('recomendacoes', e.target.value)} placeholder="Recomendações para o cliente ou próxima intervenção." />
            </label>
            <label className="field-group full">
              <span>Observações gerais</span>
              <textarea rows={2} value={certForm.observacoes} onChange={(e) => setCertF('observacoes', e.target.value)} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setCertOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">{editingCert ? 'Salvar alterações' : 'Emitir certificado'}</button>
          </div>
        </form>
      </Modal>

      {/* ROUTINE MODAL */}
      <Modal open={routineOpen} title={editingRoutine ? 'Editar rotina' : 'Nova rotina técnica'} onClose={() => setRoutineOpen(false)}>
        <form className="editor-form" onSubmit={saveRoutine}>
          <div className="field-grid">
            <label className="field-group"><span>Nome *</span><input required value={routineForm.nome} onChange={(e) => setRoutineForm((p) => ({ ...p, nome: e.target.value }))} /></label>
            <label className="field-group">
              <span>Tipo *</span>
              <select required value={routineForm.tipo} onChange={(e) => setRoutineForm((p) => ({ ...p, tipo: e.target.value as TipoCertificado }))}>
                {TIPO_CERTIFICADO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label className="field-group"><span>Tipo de equipamento *</span><input required value={routineForm.equipamentoTipo} onChange={(e) => setRoutineForm((p) => ({ ...p, equipamentoTipo: e.target.value }))} placeholder="Ex.: Monitorização, Infusão..." /></label>
            <label className="field-group">
              <span>Ativo</span>
              <select value={routineForm.ativo ? 'true' : 'false'} onChange={(e) => setRoutineForm((p) => ({ ...p, ativo: e.target.value === 'true' }))}>
                <option value="true">Sim</option><option value="false">Não</option>
              </select>
            </label>
            <label className="field-group full"><span>Descrição</span><textarea rows={2} value={routineForm.descricao} onChange={(e) => setRoutineForm((p) => ({ ...p, descricao: e.target.value }))} /></label>
            <label className="field-group full"><span>Critérios de aprovação</span><textarea rows={2} value={routineForm.criteriosAprovacao} onChange={(e) => setRoutineForm((p) => ({ ...p, criteriosAprovacao: e.target.value }))} /></label>
            <label className="field-group full">
              <span>Campos de medição</span>
              <textarea rows={7} value={routineForm.camposText} onChange={(e) => setRoutineForm((p) => ({ ...p, camposText: e.target.value }))} placeholder={'Campo | Referência | Unidade\nEx.: Fluxo programado | 100 | ml/h'} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setRoutineOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar rotina</button>
          </div>
        </form>
      </Modal>

      {/* PADRAO MODAL */}
      <Modal open={padraoOpen} title={editingPadrao ? 'Editar padrão' : 'Novo padrão de calibração'} onClose={() => setPadraoOpen(false)}>
        <form className="editor-form" onSubmit={savePadrao}>
          <div className="field-grid">
            <label className="field-group"><span>Nome / Instrumento *</span><input required value={padraoForm.nome} onChange={(e) => setPadraoForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Analisador Fluke VT650" /></label>
            <label className="field-group"><span>Tipo *</span><input required value={padraoForm.tipo} onChange={(e) => setPadraoForm((p) => ({ ...p, tipo: e.target.value }))} placeholder="Ex.: Analisador de gases" /></label>
            <label className="field-group"><span>Número de série *</span><input required value={padraoForm.numeroSerie} onChange={(e) => setPadraoForm((p) => ({ ...p, numeroSerie: e.target.value }))} /></label>
            <label className="field-group"><span>Fabricante</span><input value={padraoForm.fabricante} onChange={(e) => setPadraoForm((p) => ({ ...p, fabricante: e.target.value }))} /></label>
            <label className="field-group"><span>Data última calibração *</span><input type="date" required value={padraoForm.dataCalibracao} onChange={(e) => setPadraoForm((p) => ({ ...p, dataCalibracao: e.target.value }))} /></label>
            <label className="field-group"><span>Validade da calibração *</span><input type="date" required value={padraoForm.validadeCalibracao} onChange={(e) => setPadraoForm((p) => ({ ...p, validadeCalibracao: e.target.value }))} /></label>
            <label className="field-group"><span>Laboratório / Responsável</span><input value={padraoForm.responsavel} onChange={(e) => setPadraoForm((p) => ({ ...p, responsavel: e.target.value }))} placeholder="IMETRO / Laboratório parceiro" /></label>
            <label className="field-group full"><span>Observações</span><textarea rows={3} value={padraoForm.observacoes} onChange={(e) => setPadraoForm((p) => ({ ...p, observacoes: e.target.value }))} /></label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setPadraoOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar padrão</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
