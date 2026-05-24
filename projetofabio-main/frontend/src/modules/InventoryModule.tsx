import { type EntityConfig, formatCurrency } from '@atlasmed/shared'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'
import { buildInitialForm, readInputValue, serializeForm } from './formUtils'

interface InventoryModuleProps {
  config: EntityConfig
}

export function InventoryModule({ config }: InventoryModuleProps) {
  const { collections, ensureCollections, saveRecord, deleteRecord, moveInventory, resolveLabel } = useAppData()
  const { showNotice } = useUi()
  const [search, setSearch] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [open, setOpen] = useState(false)
  const [movementOpen, setMovementOpen] = useState(false)
  const [movementTarget, setMovementTarget] = useState<Record<string, unknown> | null>(null)
  const [movementType, setMovementType] = useState<'Entrada' | 'Saída'>('Entrada')
  const [movementQty, setMovementQty] = useState(1)
  const [movementCost, setMovementCost] = useState(0)
  const [movementNotes, setMovementNotes] = useState('')
  const [movementSupplier, setMovementSupplier] = useState('')
  const [form, setForm] = useState<Record<string, unknown>>(() => buildInitialForm(config))
  const deferredSearch = useDeferredValue(search)
  const { viewMode, setViewMode } = useModuleViewMode(`${config.collection}:inventory`)

  useEffect(() => {
    void ensureCollections([config.collection, 'fornecedores'])
  }, [config.collection, ensureCollections])

  const records = (collections[config.collection] ?? []) as unknown as Array<Record<string, unknown>>
  const filteredRecords = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return records.filter((record) => {
      const matchesSearch = !term || config.searchableKeys.some((key) => String(record[key] ?? '').toLowerCase().includes(term))
      const lowStock = Number(record.quantidade ?? 0) <= Number(record.minimo ?? 0)
      return matchesSearch && (!onlyLowStock || lowStock)
    })
  }, [config.searchableKeys, deferredSearch, onlyLowStock, records])

  function openCreate() {
    setEditing(null)
    setForm(buildInitialForm(config))
    setOpen(true)
  }

  function openEdit(record: Record<string, unknown>) {
    setEditing(record)
    setForm(buildInitialForm(config, record))
    setOpen(true)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveRecord(config.collection, {
        ...serializeForm(config, form),
        historico: editing?.historico ?? [{ data: new Date().toISOString(), tipo: 'Criação', qtd: Number(form.quantidade ?? 0), saldo: Number(form.quantidade ?? 0), obs: 'Cadastro inicial' }],
        id: editing?.id as string | undefined,
      } as never)
      showNotice({ tone: 'success', title: 'Estoque salvo', message: `${config.singularLabel} atualizado com sucesso.` })
      setOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Deseja remover esta ${config.singularLabel}?`)) return
    await deleteRecord(config.collection, id)
    showNotice({ tone: 'success', title: 'Registro removido', message: `${config.singularLabel} removido do estoque.` })
  }

  async function handleMove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!movementTarget?.id) return
    try {
      await moveInventory(config.collection as 'pecas' | 'acessorios', String(movementTarget.id), {
        tipo: movementType,
        quantidade: movementQty,
        observacao: movementNotes,
        custoUnitario: movementType === 'Entrada' ? movementCost : undefined,
        fornecedorId: movementType === 'Entrada' ? movementSupplier || undefined : undefined,
      })
      showNotice({ tone: 'success', title: 'Movimento registrado', message: 'O saldo do item foi atualizado.' })
      setMovementOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao movimentar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  const lowStockCount = records.filter((record) => Number(record.quantidade ?? 0) <= Number(record.minimo ?? 0)).length
  const suppliers = (collections.fornecedores ?? []) as unknown as Array<Record<string, unknown>>

  return (
    <section className="module-card">
      <div className="module-heading">
        <div className="summary-grid compact module-summary-grid">
        <article className="metric-card">
          <span>Itens ativos</span>
          <strong>{records.length}</strong>
        </article>
        <article className="metric-card warning">
          <span>Baixo estoque</span>
          <strong>{lowStockCount}</strong>
        </article>
        </div>
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por código ou nome..." total={filteredRecords.length} />
          <label className="checkbox-field compact">
            <input checked={onlyLowStock} type="checkbox" onChange={(event) => setOnlyLowStock(event.target.checked)} />
            <span>Baixo estoque</span>
          </label>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={openCreate}>
            Novo item
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? <div className="empty-state">Nenhum item corresponde aos filtros atuais.</div> : null}

      {filteredRecords.length > 0 && viewMode === 'list' ? (
        <div className="table-shell inventory-grid">
          <div className="table-head inventory-row">
            <span>Código</span>
            <span>Item</span>
            <span>Fornecedor</span>
            <span>Saldo</span>
            <span>Mínimo</span>
            <span>Custo</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {filteredRecords.map((record) => (
            <div key={String(record.id)} className="table-row inventory-row">
              <span>{String(record.id)}</span>
              <div>
                <strong>{String(record.nome)}</strong>
                <small>{String(record.codigo ?? '')}</small>
              </div>
              <span>{resolveLabel('fornecedores', String(record.fornecedorId ?? ''), 'nome')}</span>
              <span>{String(record.quantidade ?? 0)}</span>
              <span>{String(record.minimo ?? 0)}</span>
              <span>{formatCurrency(Number(record.precoCusto ?? 0))}</span>
              <StatusPill label={String(record.status ?? '-')} />
              <div className="inline-actions">
                <button className="ghost-button sm" type="button" onClick={() => openEdit(record)}>
                  Editar
                </button>
                <button className="ghost-button sm" type="button" onClick={() => {
                  setMovementTarget(record)
                  setMovementType('Entrada')
                  setMovementQty(1)
                  setMovementCost(Number(record.precoCusto ?? 0))
                  setMovementSupplier(String(record.fornecedorId ?? ''))
                  setMovementNotes('')
                  setMovementOpen(true)
                }}>
                  Entrada
                </button>
                <button className="ghost-button sm" type="button" onClick={() => {
                  setMovementTarget(record)
                  setMovementType('Saída')
                  setMovementQty(1)
                  setMovementCost(Number(record.precoCusto ?? 0))
                  setMovementSupplier(String(record.fornecedorId ?? ''))
                  setMovementNotes('')
                  setMovementOpen(true)
                }}>
                  Saída
                </button>
                <button className="ghost-button sm danger" type="button" onClick={() => handleDelete(String(record.id))}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {filteredRecords.length > 0 && viewMode === 'grid' ? (
        <div className="record-grid">
          {filteredRecords.map((record) => (
            <article key={String(record.id)} className="record-card">
              <div className="record-card-head">
                <div>
                  <p className="record-kicker">{config.singularLabel}</p>
                  <h3>{String(record.nome)}</h3>
                  <p className="record-support">{String(record.id)} · {resolveLabel('fornecedores', String(record.fornecedorId ?? ''), 'nome')}</p>
                </div>
                <StatusPill label={String(record.status ?? '-')} />
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>Saldo</span>
                  <strong>{String(record.quantidade ?? 0)}</strong>
                </div>
                <div className="record-stat">
                  <span>Mínimo</span>
                  <strong>{String(record.minimo ?? 0)}</strong>
                </div>
                <div className="record-stat">
                  <span>Custo</span>
                  <strong>{formatCurrency(Number(record.precoCusto ?? 0))}</strong>
                </div>
                <div className="record-stat">
                  <span>Código</span>
                  <strong>{String(record.codigo ?? '-')}</strong>
                </div>
              </div>
              <div className="record-card-actions">
                <button className="ghost-button" type="button" onClick={() => openEdit(record)}>
                  Editar
                </button>
                <button className="ghost-button" type="button" onClick={() => {
                  setMovementTarget(record)
                  setMovementType('Entrada')
                  setMovementQty(1)
                  setMovementCost(Number(record.precoCusto ?? 0))
                  setMovementSupplier(String(record.fornecedorId ?? ''))
                  setMovementNotes('')
                  setMovementOpen(true)
                }}>
                  Entrada
                </button>
                <button className="ghost-button" type="button" onClick={() => {
                  setMovementTarget(record)
                  setMovementType('Saída')
                  setMovementQty(1)
                  setMovementCost(Number(record.precoCusto ?? 0))
                  setMovementSupplier(String(record.fornecedorId ?? ''))
                  setMovementNotes('')
                  setMovementOpen(true)
                }}>
                  Saída
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(String(record.id))}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal open={open} title={editing ? 'Editar item' : 'Novo item'} onClose={() => setOpen(false)}>
        <form className="editor-form" onSubmit={handleSave}>
          <div className="field-grid">
            {config.fields.map((field) => {
              const relationOptions = field.relation
                ? (((collections[field.relation.collection] ?? []) as unknown as Array<Record<string, unknown>>).map((item) => ({ label: String(item[field.relation!.labelKey] ?? item.id), value: String(item.id) })))
                : (field.options ?? [])

              if (field.type === 'textarea') {
                return (
                  <label key={field.key} className="field-group full">
                    <span>{field.label}</span>
                    <textarea rows={4} value={readInputValue(form[field.key])} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
                  </label>
                )
              }

              if (field.type === 'relation' || field.type === 'select') {
                return (
                  <label key={field.key} className="field-group">
                    <span>{field.label}</span>
                    <select value={readInputValue(form[field.key])} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                      <option value="">Selecione</option>
                      {relationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }

              return (
                <label key={field.key} className="field-group">
                  <span>{field.label}</span>
                  <input
                    type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                    value={readInputValue(form[field.key])}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: field.type === 'number' || field.type === 'currency' ? Number(event.target.value || 0) : event.target.value }))}
                  />
                </label>
              )
            })}
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={movementOpen} title={`${movementType} de estoque`} subtitle={String(movementTarget?.nome ?? '')} onClose={() => setMovementOpen(false)}>
        <form className="editor-form" onSubmit={handleMove}>
          <div className="field-grid">
            <label className="field-group">
              <span>Tipo</span>
              <select value={movementType} onChange={(event) => setMovementType(event.target.value as 'Entrada' | 'Saída')}>
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
              </select>
            </label>
            <label className="field-group">
              <span>Quantidade</span>
              <input min={1} type="number" value={movementQty} onChange={(event) => setMovementQty(Number(event.target.value || 1))} />
            </label>
            {movementType === 'Entrada' ? (
              <label className="field-group">
                <span>Custo unitário</span>
                <input min={0} step={0.01} type="number" value={movementCost} onChange={(event) => setMovementCost(Number(event.target.value || 0))} />
              </label>
            ) : null}
            {movementType === 'Entrada' ? (
              <label className="field-group">
                <span>Fornecedor</span>
                <select value={movementSupplier} onChange={(event) => setMovementSupplier(event.target.value)}>
                  <option value="">Selecione</option>
                  {suppliers.map((supplier) => (
                    <option key={String(supplier.id)} value={String(supplier.id)}>
                      {String(supplier.nome)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field-group full">
              <span>Observação</span>
              <textarea rows={4} value={movementNotes} onChange={(event) => setMovementNotes(event.target.value)} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setMovementOpen(false)}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              Registrar movimento
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}