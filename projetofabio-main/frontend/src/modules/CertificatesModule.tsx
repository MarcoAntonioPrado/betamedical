import { formatDate } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'

function parseRoutineFields(source: string) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nome, referencia, unidade] = line.split('|').map((part) => part.trim())
      return { nome, referencia, unidade }
    })
}

function parseChecklist(source: string) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nome, status, medicao] = line.split('|').map((part) => part.trim())
      return { nome, status: (status || 'ok') as 'ok' | 'nok' | 'conforme' | 'nao-conforme', medicao }
    })
}

export function CertificatesModule() {
  const { collections, ensureCollections, saveRecord, deleteRecord } = useAppData()
  const { showNotice } = useUi()
  const [tab, setTab] = useState<'certificados' | 'rotinas'>('certificados')
  const [certificateSearch, setCertificateSearch] = useState('')
  const [routineSearch, setRoutineSearch] = useState('')
  const [routineOpen, setRoutineOpen] = useState(false)
  const [certificateOpen, setCertificateOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Record<string, unknown> | null>(null)
  const [editingCertificate, setEditingCertificate] = useState<Record<string, unknown> | null>(null)
  const [routineForm, setRoutineForm] = useState({ nome: '', tipo: 'preventiva', equipamentoTipo: '', camposText: '' })
  const [certificateForm, setCertificateForm] = useState({
    equipamentoId: '',
    rotinaId: '',
    padraoId: '',
    funcionarioId: '',
    tipo: 'preventiva',
    data: new Date().toISOString().slice(0, 10),
    statusGeral: 'aprovado',
    observacoes: '',
    checklistText: '',
  })

  useEffect(() => {
    void ensureCollections(['certificados', 'rotinasCertificacao', 'padroesCalibracao', 'equipamentos', 'funcionarios'])
  }, [ensureCollections])

  const routines = collections.rotinasCertificacao ?? []
  const certificates = collections.certificados ?? []
  const equipments = collections.equipamentos ?? []
  const patterns = collections.padroesCalibracao ?? []
  const staff = collections.funcionarios ?? []
  const { viewMode: certificateViewMode, setViewMode: setCertificateViewMode } = useModuleViewMode('certificados:emitidos')
  const { viewMode: routineViewMode, setViewMode: setRoutineViewMode } = useModuleViewMode('certificados:rotinas')

  const approvedCount = useMemo(() => certificates.filter((item) => item.statusGeral === 'aprovado').length, [certificates])
  const filteredCertificates = useMemo(
    () => certificates.filter((item) => !certificateSearch || `${item.id} ${item.equipamentoNome} ${item.statusGeral} ${item.tecnicoNome}`.toLowerCase().includes(certificateSearch.toLowerCase())),
    [certificateSearch, certificates],
  )
  const filteredRoutines = useMemo(
    () => routines.filter((routine) => !routineSearch || `${routine.nome} ${routine.tipo} ${routine.equipamentoTipo}`.toLowerCase().includes(routineSearch.toLowerCase())),
    [routineSearch, routines],
  )

  function resetRoutineForm() {
    setEditingRoutine(null)
    setRoutineForm({ nome: '', tipo: 'preventiva', equipamentoTipo: '', camposText: '' })
  }

  function resetCertificateForm() {
    setEditingCertificate(null)
    setCertificateForm({
      equipamentoId: '',
      rotinaId: '',
      padraoId: '',
      funcionarioId: '',
      tipo: 'preventiva',
      data: new Date().toISOString().slice(0, 10),
      statusGeral: 'aprovado',
      observacoes: '',
      checklistText: '',
    })
  }

  async function saveRoutine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveRecord('rotinasCertificacao', {
        id: editingRoutine?.id as string | undefined,
        nome: routineForm.nome,
        tipo: routineForm.tipo as never,
        equipamentoTipo: routineForm.equipamentoTipo,
        campos: parseRoutineFields(routineForm.camposText),
      })
      showNotice({ tone: 'success', title: 'Rotina salva', message: 'A rotina técnica foi atualizada.' })
      setRoutineOpen(false)
      resetRoutineForm()
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function saveCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const equipment = equipments.find((item) => item.id === certificateForm.equipamentoId)
      const routine = routines.find((item) => item.id === certificateForm.rotinaId)
      const pattern = patterns.find((item) => item.id === certificateForm.padraoId)
      const technician = staff.find((item) => item.id === certificateForm.funcionarioId)

      await saveRecord('certificados', {
        id: editingCertificate?.id as string | undefined,
        equipamentoId: certificateForm.equipamentoId,
        equipamentoNome: equipment?.nome ?? '',
        equipamentoNumeroSerie: equipment?.numeroSerie ?? '',
        rotinaId: certificateForm.rotinaId || undefined,
        rotinaNome: routine?.nome,
        padraoId: certificateForm.padraoId || undefined,
        padraoNome: pattern?.nome,
        tecnicoNome: technician?.nome ?? '',
        tipo: certificateForm.tipo as never,
        data: certificateForm.data,
        statusGeral: certificateForm.statusGeral as never,
        observacoes: certificateForm.observacoes,
        checklist: parseChecklist(certificateForm.checklistText),
      })
      showNotice({ tone: 'success', title: 'Certificado salvo', message: 'O registro técnico foi salvo.' })
      setCertificateOpen(false)
      resetCertificateForm()
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  return (
    <section className="module-card">
      <div className="summary-grid compact">
        <article className="metric-card">
          <span>Certificados emitidos</span>
          <strong>{certificates.length}</strong>
        </article>
        <article className="metric-card success">
          <span>Aprovados</span>
          <strong>{approvedCount}</strong>
        </article>
        <article className="metric-card">
          <span>Rotinas disponíveis</span>
          <strong>{routines.length}</strong>
        </article>
      </div>

      <div className="segmented-switch tab-switch">
        <button type="button" className={tab === 'certificados' ? 'switch-option active' : 'switch-option'} onClick={() => setTab('certificados')}>Certificados</button>
        <button type="button" className={tab === 'rotinas' ? 'switch-option active' : 'switch-option'} onClick={() => setTab('rotinas')}>Rotinas</button>
      </div>

      {tab === 'certificados' ? (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Emissão</p>
              <h3>Registros técnicos</h3>
            </div>
            <div className="module-toolbar-actions">
              <SearchField value={certificateSearch} onChange={setCertificateSearch} placeholder="Pesquisar por registro, equipamento ou técnico..." total={filteredCertificates.length} />
              <ViewModeToggle value={certificateViewMode} onChange={setCertificateViewMode} />
              <button className="primary-button" type="button" onClick={() => { resetCertificateForm(); setCertificateOpen(true) }}>
                Novo certificado
              </button>
            </div>
          </div>
          {filteredCertificates.length === 0 ? <div className="empty-state">Nenhum certificado encontrado.</div> : null}
          {filteredCertificates.length > 0 && certificateViewMode === 'list' ? (
            <div className="table-shell certificate-grid">
              <div className="table-head certificate-row">
                <span>Registro</span>
                <span>Equipamento</span>
                <span>Data</span>
                <span>Status</span>
                <span>Ações</span>
              </div>
              {filteredCertificates.map((item) => (
                <div key={item.id} className="table-row certificate-row">
                  <span>{item.id}</span>
                  <span>{item.equipamentoNome}</span>
                  <span>{formatDate(item.data)}</span>
                  <StatusPill label={item.statusGeral} />
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingCertificate(item as unknown as Record<string, unknown>)
                      setCertificateForm({
                        equipamentoId: item.equipamentoId,
                        rotinaId: item.rotinaId ?? '',
                        padraoId: item.padraoId ?? '',
                        funcionarioId: staff.find((person) => person.nome === item.tecnicoNome)?.id ?? '',
                        tipo: item.tipo,
                        data: item.data,
                        statusGeral: item.statusGeral,
                        observacoes: item.observacoes ?? '',
                        checklistText: (item.checklist ?? []).map((entry) => `${entry.nome} | ${entry.status} | ${entry.medicao ?? ''}`).join('\n'),
                      })
                      setCertificateOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('certificados', item.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {filteredCertificates.length > 0 && certificateViewMode === 'grid' ? (
            <div className="record-grid">
              {filteredCertificates.map((item) => (
                <article key={item.id} className="record-card">
                  <div className="record-card-head">
                    <div>
                      <p className="record-kicker">Certificado</p>
                      <h3>{item.equipamentoNome}</h3>
                      <p className="record-support">{item.id} · {item.tecnicoNome}</p>
                    </div>
                    <StatusPill label={item.statusGeral} />
                  </div>
                  <div className="record-card-grid">
                    <div className="record-stat">
                      <span>Data</span>
                      <strong>{formatDate(item.data)}</strong>
                    </div>
                    <div className="record-stat">
                      <span>Tipo</span>
                      <strong>{item.tipo}</strong>
                    </div>
                  </div>
                  <div className="record-card-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingCertificate(item as unknown as Record<string, unknown>)
                      setCertificateForm({
                        equipamentoId: item.equipamentoId,
                        rotinaId: item.rotinaId ?? '',
                        padraoId: item.padraoId ?? '',
                        funcionarioId: staff.find((person) => person.nome === item.tecnicoNome)?.id ?? '',
                        tipo: item.tipo,
                        data: item.data,
                        statusGeral: item.statusGeral,
                        observacoes: item.observacoes ?? '',
                        checklistText: (item.checklist ?? []).map((entry) => `${entry.nome} | ${entry.status} | ${entry.medicao ?? ''}`).join('\n'),
                      })
                      setCertificateOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('certificados', item.id)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Base técnica</p>
              <h3>Rotinas cadastradas</h3>
            </div>
            <div className="module-toolbar-actions">
              <SearchField value={routineSearch} onChange={setRoutineSearch} placeholder="Pesquisar por rotina, tipo ou equipamento..." total={filteredRoutines.length} />
              <ViewModeToggle value={routineViewMode} onChange={setRoutineViewMode} />
              <button className="primary-button" type="button" onClick={() => { resetRoutineForm(); setRoutineOpen(true) }}>
                Nova rotina
              </button>
            </div>
          </div>
          {filteredRoutines.length === 0 ? <div className="empty-state">Nenhuma rotina encontrada.</div> : null}
          {filteredRoutines.length > 0 && routineViewMode === 'list' ? (
            <div className="table-shell">
              <div className="table-head table-row-grid">
                <span>Rotina</span>
                <span>Tipo</span>
                <span>Equipamento</span>
                <span>Campos</span>
                <span>Ações</span>
              </div>
              {filteredRoutines.map((routine) => (
                <div key={routine.id} className="table-row table-row-grid">
                  <span>{routine.nome}</span>
                  <span>{routine.tipo}</span>
                  <span>{routine.equipamentoTipo}</span>
                  <span>{routine.campos.length}</span>
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingRoutine(routine as unknown as Record<string, unknown>)
                      setRoutineForm({
                        nome: routine.nome,
                        tipo: routine.tipo,
                        equipamentoTipo: routine.equipamentoTipo,
                        camposText: routine.campos.map((field) => `${field.nome} | ${field.referencia ?? ''} | ${field.unidade ?? ''}`).join('\n'),
                      })
                      setRoutineOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('rotinasCertificacao', routine.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {filteredRoutines.length > 0 && routineViewMode === 'grid' ? (
            <div className="record-grid">
              {filteredRoutines.map((routine) => (
                <article key={routine.id} className="record-card">
                  <div className="record-card-head">
                    <div>
                      <p className="record-kicker">Rotina</p>
                      <h3>{routine.nome}</h3>
                      <p className="record-support">{routine.equipamentoTipo}</p>
                    </div>
                    <span className="record-identity">{routine.tipo}</span>
                  </div>
                  <div className="record-card-grid">
                    <div className="record-stat">
                      <span>Campos</span>
                      <strong>{routine.campos.length}</strong>
                    </div>
                    <div className="record-stat">
                      <span>Tipo</span>
                      <strong>{routine.tipo}</strong>
                    </div>
                  </div>
                  <div className="record-card-actions">
                    <button className="ghost-button" type="button" onClick={() => {
                      setEditingRoutine(routine as unknown as Record<string, unknown>)
                      setRoutineForm({
                        nome: routine.nome,
                        tipo: routine.tipo,
                        equipamentoTipo: routine.equipamentoTipo,
                        camposText: routine.campos.map((field) => `${field.nome} | ${field.referencia ?? ''} | ${field.unidade ?? ''}`).join('\n'),
                      })
                      setRoutineOpen(true)
                    }}>Editar</button>
                    <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('rotinasCertificacao', routine.id)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}

      <Modal open={routineOpen} title={editingRoutine ? 'Editar rotina' : 'Nova rotina'} onClose={() => setRoutineOpen(false)}>
        <form className="editor-form" onSubmit={saveRoutine}>
          <div className="field-grid">
            <label className="field-group">
              <span>Nome</span>
              <input value={routineForm.nome} onChange={(event) => setRoutineForm((current) => ({ ...current, nome: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Tipo</span>
              <select value={routineForm.tipo} onChange={(event) => setRoutineForm((current) => ({ ...current, tipo: event.target.value }))}>
                <option value="preventiva">Preventiva</option>
                <option value="calibracao">Calibração</option>
              </select>
            </label>
            <label className="field-group">
              <span>Tipo de equipamento</span>
              <input value={routineForm.equipamentoTipo} onChange={(event) => setRoutineForm((current) => ({ ...current, equipamentoTipo: event.target.value }))} />
            </label>
            <label className="field-group full">
              <span>Checklist da rotina</span>
              <textarea rows={7} value={routineForm.camposText} onChange={(event) => setRoutineForm((current) => ({ ...current, camposText: event.target.value }))} placeholder="Campo | Referência | Unidade" />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setRoutineOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar rotina</button>
          </div>
        </form>
      </Modal>

      <Modal open={certificateOpen} title={editingCertificate ? 'Editar certificado' : 'Novo certificado'} onClose={() => setCertificateOpen(false)}>
        <form className="editor-form" onSubmit={saveCertificate}>
          <div className="field-grid">
            <label className="field-group">
              <span>Equipamento</span>
              <select value={certificateForm.equipamentoId} onChange={(event) => setCertificateForm((current) => ({ ...current, equipamentoId: event.target.value }))}>
                <option value="">Selecione</option>
                {equipments.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Rotina</span>
              <select value={certificateForm.rotinaId} onChange={(event) => setCertificateForm((current) => ({ ...current, rotinaId: event.target.value }))}>
                <option value="">Selecione</option>
                {routines.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Padrão de calibração</span>
              <select value={certificateForm.padraoId} onChange={(event) => setCertificateForm((current) => ({ ...current, padraoId: event.target.value }))}>
                <option value="">Selecione</option>
                {patterns.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Técnico</span>
              <select value={certificateForm.funcionarioId} onChange={(event) => setCertificateForm((current) => ({ ...current, funcionarioId: event.target.value }))}>
                <option value="">Selecione</option>
                {staff.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Tipo</span>
              <select value={certificateForm.tipo} onChange={(event) => setCertificateForm((current) => ({ ...current, tipo: event.target.value }))}>
                <option value="preventiva">Preventiva</option>
                <option value="calibracao">Calibração</option>
              </select>
            </label>
            <label className="field-group">
              <span>Data</span>
              <input type="date" value={certificateForm.data} onChange={(event) => setCertificateForm((current) => ({ ...current, data: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Status geral</span>
              <select value={certificateForm.statusGeral} onChange={(event) => setCertificateForm((current) => ({ ...current, statusGeral: event.target.value }))}>
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </label>
            <label className="field-group full">
              <span>Checklist</span>
              <textarea rows={7} value={certificateForm.checklistText} onChange={(event) => setCertificateForm((current) => ({ ...current, checklistText: event.target.value }))} placeholder="Item | status | medição" />
            </label>
            <label className="field-group full">
              <span>Observações</span>
              <textarea rows={4} value={certificateForm.observacoes} onChange={(event) => setCertificateForm((current) => ({ ...current, observacoes: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setCertificateOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar certificado</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}