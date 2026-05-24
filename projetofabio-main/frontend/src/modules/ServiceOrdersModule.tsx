import { formatDate } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'

interface UsageRow {
  itemId: string
  quantidade: number
}

const emptyUsageRow: UsageRow = { itemId: '', quantidade: 1 }

function printOS(order: Record<string, unknown>, equipmentName: string, clientName: string, techName: string) {
  const statusColor = order.status === 'Concluída' ? '#16a34a' : order.status === 'Em Manutenção' ? '#d97706' : '#2563eb'
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>OS ${order.id as string}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; }
  @page { size: A4; margin: 15mm; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
  .co { font-size: 14pt; font-weight: bold; color: #1e40af; }
  .co-sub { font-size: 9pt; color: #666; }
  .os-title { text-align: right; }
  .os-title h1 { font-size: 12pt; font-weight: bold; color: #1e40af; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-weight: bold; color: white; background: ${statusColor}; margin-top: 4px; font-size: 9pt; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 6px; }
  .kv { margin-bottom: 4px; }
  .kv span { font-size: 8pt; color: #666; display: block; }
  .kv strong { font-size: 9.5pt; }
  .text-block { font-size: 9pt; line-height: 1.6; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 40px; white-space: pre-wrap; }
  .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 8pt; color: #444; }
  .footer { margin-top: 16px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8pt; color: #777; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="co">AtlasMed Engenharia Clínica</div>
    <div class="co-sub">Gestão de Equipamentos Médicos</div>
  </div>
  <div class="os-title">
    <h1>ORDEM DE SERVIÇO</h1>
    <div style="font-size:9pt;color:#555">Nº ${order.id as string}</div>
    <div class="badge">${order.status as string}</div>
  </div>
</div>
<div class="two-col">
  <div class="section">
    <div class="section-title">Dados do Equipamento</div>
    <div class="kv"><span>Equipamento</span><strong>${equipmentName}</strong></div>
    <div class="kv"><span>Local</span><strong>${(order.localizacao as string) ?? '—'}</strong></div>
  </div>
  <div class="section">
    <div class="section-title">Dados da OS</div>
    <div class="kv"><span>Cliente</span><strong>${clientName}</strong></div>
    <div class="kv"><span>Data</span><strong>${formatDate(order.data as string)}</strong></div>
    <div class="kv"><span>Prioridade</span><strong>${(order.prioridade as string) ?? '—'}</strong></div>
    <div class="kv"><span>Técnico</span><strong>${techName}</strong></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Descrição do problema / serviço solicitado</div>
  <div class="text-block">${(order.descricao as string) ?? '—'}</div>
</div>
${order.servicosExecutados ? `<div class="section">
  <div class="section-title">Serviços executados</div>
  <div class="text-block">${order.servicosExecutados as string}</div>
</div>` : ''}
${order.fechamento ? `<div class="section">
  <div class="section-title">Encerramento</div>
  <div class="kv"><span>Ação corretiva</span><strong>${(order.fechamento as Record<string, string>).acao ?? '—'}</strong></div>
  <div class="kv"><span>Causa raiz / problema</span><strong>${(order.fechamento as Record<string, string>).problema ?? '—'}</strong></div>
</div>` : ''}
<div class="sig-block">
  <div><div class="sig-line">${techName}<br>Técnico Responsável</div></div>
  <div><div class="sig-line">___________________________<br>Aprovação do Cliente / Gestor</div></div>
</div>
<div class="footer">
  <span>AtlasMed Engenharia Clínica</span>
  <span>OS ${order.id as string} · ${formatDate(order.data as string)}</span>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Popup bloqueado. Permita popups neste site.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

export function ServiceOrdersModule() {
  const { collections, ensureCollections, saveRecord, deleteRecord, closeServiceOrder, resolveLabel } = useAppData()
  const { showNotice } = useUi()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [closing, setClosing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    clienteId: '',
    equipamentoId: '',
    funcionarioId: '',
    orcamentoId: '',
    descricao: '',
    localizacao: '',
    data: new Date().toISOString().slice(0, 10),
    status: 'Aguardando Início',
    prioridade: 'Media',
    servicosExecutados: '',
  })
  const [closeForm, setCloseForm] = useState({
    funcionarioId: '',
    acao: '',
    problema: '',
    pecasUsadas: [emptyUsageRow],
    acessoriosUsados: [emptyUsageRow],
  })
  const { viewMode, setViewMode } = useModuleViewMode('ordens-servico', 'grid')

  useEffect(() => {
    void ensureCollections(['ordensServico', 'clientes', 'equipamentos', 'funcionarios', 'orcamentos', 'pecas', 'acessorios'])
  }, [ensureCollections])

  const orders = collections.ordensServico ?? []
  const filtered = useMemo(
    () => orders.filter((order) => !search || `${order.id} ${order.descricao} ${order.status}`.toLowerCase().includes(search.toLowerCase())),
    [orders, search],
  )

  function resetForm() {
    setEditing(null)
    setForm({
      clienteId: '',
      equipamentoId: '',
      funcionarioId: '',
      orcamentoId: '',
      descricao: '',
      localizacao: '',
      data: new Date().toISOString().slice(0, 10),
      status: 'Aguardando Início',
      prioridade: 'Media',
      servicosExecutados: '',
    })
  }

  function openEdit(record: Record<string, unknown>) {
    setEditing(record)
    setForm({
      clienteId: String(record.clienteId ?? ''),
      equipamentoId: String(record.equipamentoId ?? ''),
      funcionarioId: String(record.funcionarioId ?? ''),
      orcamentoId: String(record.orcamentoId ?? ''),
      descricao: String(record.descricao ?? ''),
      localizacao: String(record.localizacao ?? ''),
      data: String(record.data ?? ''),
      status: String(record.status ?? 'Aguardando Início'),
      prioridade: String(record.prioridade ?? 'Media'),
      servicosExecutados: String(record.servicosExecutados ?? ''),
    })
    setOpen(true)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveRecord('ordensServico', {
        id: editing?.id as string | undefined,
        clienteId: form.clienteId,
        equipamentoId: form.equipamentoId,
        funcionarioId: form.funcionarioId || undefined,
        orcamentoId: form.orcamentoId || undefined,
        descricao: form.descricao,
        localizacao: form.localizacao,
        data: form.data,
        status: form.status as never,
        prioridade: form.prioridade as never,
        servicosExecutados: form.servicosExecutados,
      })

      const equipment = (collections.equipamentos ?? []).find((item) => item.id === form.equipamentoId)
      if (equipment) {
        await saveRecord('equipamentos', {
          ...equipment,
          id: equipment.id,
          status: form.status === 'Aguardando Peça' ? 'Aguardando Peça' : 'Em Manutenção',
          ultimaIntervencao: form.data,
        })
      }

      showNotice({ tone: 'success', title: 'OS salva', message: 'A ordem de serviço foi atualizada.' })
      setOpen(false)
      resetForm()
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Deseja remover esta OS?')) return
    await deleteRecord('ordensServico', id)
    showNotice({ tone: 'success', title: 'OS removida', message: 'O registro foi removido.' })
  }

  async function handleCloseOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!closing?.id) return
    try {
      await closeServiceOrder(String(closing.id), {
        funcionarioId: closeForm.funcionarioId,
        acao: closeForm.acao,
        problema: closeForm.problema,
        pecasUsadas: closeForm.pecasUsadas.filter((item) => item.itemId).map((item) => ({ itemId: item.itemId, quantidade: Number(item.quantidade || 0) })),
        acessoriosUsados: closeForm.acessoriosUsados.filter((item) => item.itemId).map((item) => ({ itemId: item.itemId, quantidade: Number(item.quantidade || 0) })),
      })
      showNotice({ tone: 'success', title: 'OS encerrada', message: 'A ordem foi movida para o histórico e o estoque atualizado.' })
      setCloseOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao encerrar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  return (
    <section className="module-card">
      <div className="module-heading module-toolbar">
        <div className="summary-grid compact module-summary-grid">
        <article className="metric-card warm">
          <span>Ordens abertas</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="metric-card">
          <span>Aguardando peça</span>
          <strong>{orders.filter((item) => item.status === 'Aguardando Peça').length}</strong>
        </article>
        </div>
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por código, descrição ou status..." total={filtered.length} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={() => { resetForm(); setOpen(true) }}>
            Nova OS
          </button>
        </div>
      </div>

      {filtered.length === 0 ? <div className="empty-state">Nenhuma ordem de serviço encontrada.</div> : null}

      {filtered.length > 0 && viewMode === 'grid' ? (
        <div className="kanban-grid">
          {filtered.map((order) => (
            <article key={order.id} className="os-card">
              <div className="os-header">
                <strong>{order.id}</strong>
                <StatusPill label={order.status} />
              </div>
              <p>{order.descricao}</p>
              <small>{resolveLabel('equipamentos', order.equipamentoId, 'nome')} • {resolveLabel('clientes', order.clienteId, 'nome')}</small>
              <div className="os-meta">
                <span>Data: {formatDate(order.data)}</span>
                <span>Prioridade: {order.prioridade}</span>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => openEdit(order as unknown as Record<string, unknown>)}>Editar</button>
                <button className="ghost-button" type="button" onClick={() => printOS(order as unknown as Record<string, unknown>, resolveLabel('equipamentos', order.equipamentoId, 'nome'), resolveLabel('clientes', order.clienteId, 'nome'), resolveLabel('funcionarios', order.funcionarioId, 'nome'))}>PDF</button>
                <button className="ghost-button" type="button" onClick={() => {
                  setClosing(order as unknown as Record<string, unknown>)
                  setCloseForm({ funcionarioId: String(order.funcionarioId ?? ''), acao: '', problema: '', pecasUsadas: [emptyUsageRow], acessoriosUsados: [emptyUsageRow] })
                  setCloseOpen(true)
                }}>Encerrar</button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(order.id)}>Remover</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 && viewMode === 'list' ? (
        <div className="table-shell">
          <div className="table-head service-order-row">
            <span>Código</span>
            <span>Cliente</span>
            <span>Equipamento</span>
            <span>Data</span>
            <span>Status</span>
            <span>Prioridade</span>
            <span>Ações</span>
          </div>
          {filtered.map((order) => (
            <div key={order.id} className="table-row service-order-row">
              <span>{order.id}</span>
              <span>{resolveLabel('clientes', order.clienteId, 'nome')}</span>
              <span>{resolveLabel('equipamentos', order.equipamentoId, 'nome')}</span>
              <span>{formatDate(order.data)}</span>
              <StatusPill label={order.status} />
              <span>{order.prioridade}</span>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => openEdit(order as unknown as Record<string, unknown>)}>Editar</button>
                <button className="ghost-button" type="button" onClick={() => printOS(order as unknown as Record<string, unknown>, resolveLabel('equipamentos', order.equipamentoId, 'nome'), resolveLabel('clientes', order.clienteId, 'nome'), resolveLabel('funcionarios', order.funcionarioId, 'nome'))}>PDF</button>
                <button className="ghost-button" type="button" onClick={() => {
                  setClosing(order as unknown as Record<string, unknown>)
                  setCloseForm({ funcionarioId: String(order.funcionarioId ?? ''), acao: '', problema: '', pecasUsadas: [emptyUsageRow], acessoriosUsados: [emptyUsageRow] })
                  setCloseOpen(true)
                }}>Encerrar</button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(order.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Modal open={open} title={editing ? 'Editar ordem de serviço' : 'Nova ordem de serviço'} onClose={() => setOpen(false)}>
        <form className="editor-form" onSubmit={handleSave}>
          <div className="field-grid">
            <label className="field-group">
              <span>Cliente</span>
              <select value={form.clienteId} onChange={(event) => setForm((current) => ({ ...current, clienteId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.clientes ?? []).map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Equipamento</span>
              <select value={form.equipamentoId} onChange={(event) => setForm((current) => ({ ...current, equipamentoId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.equipamentos ?? []).map((equipment) => <option key={equipment.id} value={equipment.id}>{equipment.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Técnico responsável</span>
              <select value={form.funcionarioId} onChange={(event) => setForm((current) => ({ ...current, funcionarioId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.funcionarios ?? []).map((staff) => <option key={staff.id} value={staff.id}>{staff.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>OS vinculada a orçamento</span>
              <select value={form.orcamentoId} onChange={(event) => setForm((current) => ({ ...current, orcamentoId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.orcamentos ?? []).map((budget) => <option key={budget.id} value={budget.id}>{budget.id}</option>)}
              </select>
            </label>
            <label className="field-group full">
              <span>Descrição</span>
              <textarea rows={4} value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Localização</span>
              <input value={form.localizacao} onChange={(event) => setForm((current) => ({ ...current, localizacao: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Data</span>
              <input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {['Aguardando Início', 'Em Manutenção', 'Aguardando Peça', 'Aguardando Cliente', 'Em Teste', 'Pronto para Retirada'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Prioridade</span>
              <select value={form.prioridade} onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value }))}>
                {['Baixa', 'Media', 'Alta', 'Critica'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label className="field-group full">
              <span>Serviços executados</span>
              <textarea rows={4} value={form.servicosExecutados} onChange={(event) => setForm((current) => ({ ...current, servicosExecutados: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar OS</button>
          </div>
        </form>
      </Modal>

      <Modal open={closeOpen} title={`Encerrar ${String(closing?.id ?? '')}`} onClose={() => setCloseOpen(false)}>
        <form className="editor-form" onSubmit={handleCloseOrder}>
          <div className="field-grid">
            <label className="field-group">
              <span>Técnico do fechamento</span>
              <select value={closeForm.funcionarioId} onChange={(event) => setCloseForm((current) => ({ ...current, funcionarioId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.funcionarios ?? []).map((staff) => <option key={staff.id} value={staff.id}>{staff.nome}</option>)}
              </select>
            </label>
            <label className="field-group full">
              <span>Ação executada</span>
              <textarea rows={3} value={closeForm.acao} onChange={(event) => setCloseForm((current) => ({ ...current, acao: event.target.value }))} />
            </label>
            <label className="field-group full">
              <span>Diagnóstico</span>
              <textarea rows={3} value={closeForm.problema} onChange={(event) => setCloseForm((current) => ({ ...current, problema: event.target.value }))} />
            </label>
          </div>

          <section className="subpanel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Consumo técnico</p>
                <h3>Peças usadas</h3>
              </div>
              <button className="ghost-button sm" type="button" onClick={() => setCloseForm((current) => ({ ...current, pecasUsadas: [...current.pecasUsadas, emptyUsageRow] }))}>+ Peça</button>
            </div>
            {closeForm.pecasUsadas.map((row, index) => (
              <div key={`part-${index}`} className="line-item-grid compact">
                <select value={row.itemId} onChange={(event) => setCloseForm((current) => ({ ...current, pecasUsadas: current.pecasUsadas.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemId: event.target.value } : entry) }))}>
                  <option value="">Selecione</option>
                  {(collections.pecas ?? []).map((part) => <option key={part.id} value={part.id}>{part.nome}</option>)}
                </select>
                <input type="number" min={1} value={row.quantidade} onChange={(event) => setCloseForm((current) => ({ ...current, pecasUsadas: current.pecasUsadas.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantidade: Number(event.target.value || 1) } : entry) }))} />
              </div>
            ))}
          </section>

          <section className="subpanel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Consumo técnico</p>
                <h3>Acessórios usados</h3>
              </div>
              <button className="ghost-button sm" type="button" onClick={() => setCloseForm((current) => ({ ...current, acessoriosUsados: [...current.acessoriosUsados, emptyUsageRow] }))}>+ Acessório</button>
            </div>
            {closeForm.acessoriosUsados.map((row, index) => (
              <div key={`accessory-${index}`} className="line-item-grid compact">
                <select value={row.itemId} onChange={(event) => setCloseForm((current) => ({ ...current, acessoriosUsados: current.acessoriosUsados.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemId: event.target.value } : entry) }))}>
                  <option value="">Selecione</option>
                  {(collections.acessorios ?? []).map((accessory) => <option key={accessory.id} value={accessory.id}>{accessory.nome}</option>)}
                </select>
                <input type="number" min={1} value={row.quantidade} onChange={(event) => setCloseForm((current) => ({ ...current, acessoriosUsados: current.acessoriosUsados.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantidade: Number(event.target.value || 1) } : entry) }))} />
              </div>
            ))}
          </section>

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setCloseOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Encerrar OS</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}