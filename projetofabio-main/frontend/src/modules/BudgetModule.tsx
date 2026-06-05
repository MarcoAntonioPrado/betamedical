import { formatCurrency, formatDate } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useCompanyProfile } from '../hooks/useCompanyProfile'
import { useModuleViewMode } from '../hooks/useModuleViewMode'
import { printBudgetDocument } from '../lib/pdf'

interface BudgetItemForm {
  tipo: 'Servico' | 'Peça' | 'Acessório'
  descricao: string
  quantidade: number
  valorUnitario: number
  pecaId?: string
  acessorioId?: string
}

const emptyItem: BudgetItemForm = { tipo: 'Servico', descricao: '', quantidade: 1, valorUnitario: 0 }

export function BudgetModule() {
  const { collections, ensureCollections, saveRecord, deleteRecord, resolveLabel } = useAppData()
  const { showNotice } = useUi()
  const company = useCompanyProfile()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const { viewMode, setViewMode } = useModuleViewMode('orcamentos')
  const [form, setForm] = useState({
    clienteId: '',
    equipamentoId: '',
    osId: '',
    data: new Date().toISOString().slice(0, 10),
    status: 'Em elaboração',
    prazoExecucao: '',
    validadeProposta: '',
    desconto: 0,
    observacoes: '',
    items: [emptyItem] as BudgetItemForm[],
  })

  useEffect(() => {
    void ensureCollections(['orcamentos', 'clientes', 'equipamentos', 'ordensServico', 'pecas', 'acessorios'])
  }, [ensureCollections])

  const budgets = collections.orcamentos ?? []
  const filtered = useMemo(
    () => budgets.filter((budget) => !search || `${budget.id} ${resolveLabel('clientes', budget.clienteId, 'nome')} ${budget.status}`.toLowerCase().includes(search.toLowerCase())),
    [budgets, resolveLabel, search],
  )

  const subtotal = useMemo(
    () => form.items.reduce((total, item) => total + Number(item.quantidade || 0) * Number(item.valorUnitario || 0), 0),
    [form.items],
  )
  const total = subtotal - Number(form.desconto || 0)

  function resetForm() {
    setEditing(null)
    setForm({
      clienteId: '',
      equipamentoId: '',
      osId: '',
      data: new Date().toISOString().slice(0, 10),
      status: 'Em elaboração',
      prazoExecucao: '',
      validadeProposta: '',
      desconto: 0,
      observacoes: '',
      items: [emptyItem],
    })
  }

  function openEdit(record: Record<string, unknown>) {
    setEditing(record)
    setForm({
      clienteId: String(record.clienteId ?? ''),
      equipamentoId: String(record.equipamentoId ?? ''),
      osId: String(record.osId ?? ''),
      data: String(record.data ?? ''),
      status: String(record.status ?? 'Em elaboração'),
      prazoExecucao: String(record.prazoExecucao ?? ''),
      validadeProposta: String(record.validadeProposta ?? ''),
      desconto: Number(record.desconto ?? 0),
      observacoes: String(record.observacoes ?? ''),
      items: ((record.itens as BudgetItemForm[] | undefined) ?? [emptyItem]).map((item) => ({ ...item })),
    })
    setOpen(true)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveRecord('orcamentos', {
        id: editing?.id as string | undefined,
        clienteId: form.clienteId,
        equipamentoId: form.equipamentoId || undefined,
        osId: form.osId || undefined,
        data: form.data,
        status: form.status as never,
        prazoExecucao: form.prazoExecucao,
        validadeProposta: form.validadeProposta,
        desconto: Number(form.desconto || 0),
        observacoes: form.observacoes,
        itens: form.items,
        subtotal,
        total,
      })
      showNotice({ tone: 'success', title: 'Orçamento salvo', message: 'A proposta foi atualizada no beta.' })
      setOpen(false)
      resetForm()
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Deseja remover este orçamento?')) return
    await deleteRecord('orcamentos', id)
    showNotice({ tone: 'success', title: 'Orçamento removido', message: 'O registro foi removido.' })
  }

  function handlePrint(budget: Record<string, unknown>) {
    const cliente = (collections.clientes ?? []).find((item) => item.id === budget.clienteId) as Record<string, unknown> | undefined
    const equipamento = (collections.equipamentos ?? []).find((item) => item.id === budget.equipamentoId) as Record<string, unknown> | undefined
    printBudgetDocument({ company, budget, cliente, equipamento })
  }

  return (
    <section className="module-card">
      <div className="module-heading module-toolbar">
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por cliente, código ou status..." total={filtered.length} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={() => { resetForm(); setOpen(true) }}>
            Novo orçamento
          </button>
        </div>
      </div>

      {filtered.length === 0 ? <div className="empty-state">Nenhum orçamento encontrado para os filtros atuais.</div> : null}

      {filtered.length > 0 && viewMode === 'list' ? (
        <div className="table-shell budget-grid">
          <div className="table-head budget-row">
            <span>Código</span>
            <span>Cliente</span>
            <span>Data</span>
            <span>Status</span>
            <span>Total</span>
            <span>Ações</span>
          </div>
          {filtered.map((budget) => (
            <div key={budget.id} className="table-row budget-row">
              <span>{budget.id}</span>
              <span>{resolveLabel('clientes', budget.clienteId, 'nome')}</span>
              <span>{formatDate(budget.data)}</span>
              <StatusPill label={budget.status} />
              <span>{formatCurrency(Number(budget.total || 0))}</span>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => handlePrint(budget as unknown as Record<string, unknown>)}>
                  PDF
                </button>
                <button className="ghost-button" type="button" onClick={() => openEdit(budget as unknown as Record<string, unknown>)}>
                  Editar
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(budget.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 && viewMode === 'grid' ? (
        <div className="record-grid">
          {filtered.map((budget) => (
            <article key={budget.id} className="record-card">
              <div className="record-card-head">
                <div>
                  <p className="record-kicker">Orçamento</p>
                  <h3>{resolveLabel('clientes', budget.clienteId, 'nome')}</h3>
                  <p className="record-support">{budget.id}</p>
                </div>
                <StatusPill label={budget.status} />
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>Data</span>
                  <strong>{formatDate(budget.data)}</strong>
                </div>
                <div className="record-stat">
                  <span>Total</span>
                  <strong>{formatCurrency(Number(budget.total || 0))}</strong>
                </div>
              </div>
              <div className="record-card-actions">
                <button className="ghost-button" type="button" onClick={() => handlePrint(budget as unknown as Record<string, unknown>)}>
                  PDF
                </button>
                <button className="ghost-button" type="button" onClick={() => openEdit(budget as unknown as Record<string, unknown>)}>
                  Editar
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(budget.id)}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal open={open} title={editing ? 'Editar orçamento' : 'Novo orçamento'} onClose={() => setOpen(false)}>
        <form className="editor-form" onSubmit={handleSave}>
          <div className="field-grid">
            <label className="field-group">
              <span>Cliente</span>
              <select value={form.clienteId} onChange={(event) => setForm((current) => ({ ...current, clienteId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.clientes ?? []).map((client) => (
                  <option key={client.id} value={client.id}>{client.nome}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Equipamento</span>
              <select value={form.equipamentoId} onChange={(event) => setForm((current) => ({ ...current, equipamentoId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.equipamentos ?? []).map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>{equipment.nome}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>OS vinculada</span>
              <select value={form.osId} onChange={(event) => setForm((current) => ({ ...current, osId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.ordensServico ?? []).map((order) => (
                  <option key={order.id} value={order.id}>{order.id}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Data</span>
              <input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {['Em elaboração', 'Enviado', 'Aprovado', 'Rejeitado', 'Faturado'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Prazo de execução</span>
              <input value={form.prazoExecucao} onChange={(event) => setForm((current) => ({ ...current, prazoExecucao: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Validade</span>
              <input type="date" value={form.validadeProposta} onChange={(event) => setForm((current) => ({ ...current, validadeProposta: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Desconto</span>
              <input type="number" min={0} step={0.01} value={form.desconto} onChange={(event) => setForm((current) => ({ ...current, desconto: Number(event.target.value || 0) }))} />
            </label>
          </div>

          <section className="subpanel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Itens</p>
                <h3>Composição comercial</h3>
              </div>
              <button className="ghost-button sm" type="button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))}>
                + Item
              </button>
            </div>
            <div className="line-items">
              {form.items.map((item, index) => (
                <div key={`${item.descricao}-${index}`} className="line-item-grid">
                  <select value={item.tipo} onChange={(event) => setForm((current) => ({ ...current, items: current.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, tipo: event.target.value as BudgetItemForm['tipo'] } : entry) }))}>
                    <option value="Servico">Serviço</option>
                    <option value="Peça">Peça</option>
                    <option value="Acessório">Acessório</option>
                  </select>
                  <input value={item.descricao} placeholder="Descrição" onChange={(event) => setForm((current) => ({ ...current, items: current.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, descricao: event.target.value } : entry) }))} />
                  <input type="number" min={1} value={item.quantidade} onChange={(event) => setForm((current) => ({ ...current, items: current.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantidade: Number(event.target.value || 1) } : entry) }))} />
                  <input type="number" min={0} step={0.01} value={item.valorUnitario} onChange={(event) => setForm((current) => ({ ...current, items: current.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, valorUnitario: Number(event.target.value || 0) } : entry) }))} />
                  <button className="ghost-button danger" type="button" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, entryIndex) => entryIndex !== index) }))}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="totals-strip">
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              <span>Total final: {formatCurrency(total)}</span>
            </div>
          </section>

          <label className="field-group full">
            <span>Observações</span>
            <textarea rows={4} value={form.observacoes} onChange={(event) => setForm((current) => ({ ...current, observacoes: event.target.value }))} />
          </label>

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Salvar orçamento</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}