import { type CollectionName, type EntityConfig, type FieldDefinition, formatCurrency, formatDate } from '@atlasmed/shared'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'
import { buildInitialForm, isFullWidthField, readInputValue, serializeForm } from './formUtils'

interface EntityModuleProps {
  config: EntityConfig
}

function FieldEditor({
  field,
  value,
  onChange,
  options,
}: {
  field: FieldDefinition
  value: unknown
  onChange: (next: unknown) => void
  options: Array<{ label: string; value: string }>
}) {
  if (field.type === 'textarea') {
    return (
      <label className={`field-group ${isFullWidthField(field) ? 'full' : ''}`}>
        <span>{field.label}</span>
        <textarea rows={field.multilineRows ?? 4} value={readInputValue(value)} onChange={(event) => onChange(event.target.value)} />
      </label>
    )
  }

  if (field.type === 'select' || field.type === 'relation') {
    return (
      <label className="field-group">
        <span>{field.label}</span>
        <select value={readInputValue(value)} onChange={(event) => onChange(event.target.value)}>
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-field">
        <input checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <span>{field.label}</span>
      </label>
    )
  }

  return (
    <label className="field-group">
      <span>{field.label}</span>
      <input
        type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
        min={field.min}
        step={field.step ?? (field.type === 'currency' ? 0.01 : 1)}
        value={readInputValue(value)}
        onChange={(event) => onChange(field.type === 'number' || field.type === 'currency' ? Number(event.target.value || 0) : event.target.value)}
      />
    </label>
  )
}

export function EntityModule({ config }: EntityModuleProps) {
  const { collections, ensureCollections, saveRecord, deleteRecord, resolveLabel } = useAppData()
  const { showNotice } = useUi()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>(() => buildInitialForm(config))
  const deferredSearch = useDeferredValue(search)
  const { viewMode, setViewMode } = useModuleViewMode(config.collection)

  const relationCollections = useMemo(
    () => config.fields.flatMap((field) => (field.relation ? [field.relation.collection] : [])),
    [config.fields],
  )

  useEffect(() => {
    void ensureCollections([config.collection, ...relationCollections])
  }, [config.collection, ensureCollections, relationCollections])

  const records = (collections[config.collection] ?? []) as unknown as Array<Record<string, unknown>>
  const statusColumn = useMemo(
    () => config.columns.find((column) => column.type === 'status' || column.key.toLowerCase().includes('status')),
    [config.columns],
  )
  const primaryColumn = useMemo(
    () => config.columns.find((column) => column.key !== 'id' && !column.key.toLowerCase().includes('codigo') && column.type !== 'status') ?? config.columns[0],
    [config.columns],
  )
  const supportColumn = useMemo(
    () => config.columns.find((column) => column.key !== primaryColumn.key && column.key !== statusColumn?.key),
    [config.columns, primaryColumn.key, statusColumn?.key],
  )
  const cardColumns = useMemo(
    () => config.columns.filter((column) => column.key !== primaryColumn.key && column.key !== supportColumn?.key && column.key !== statusColumn?.key).slice(0, 4),
    [config.columns, primaryColumn.key, statusColumn?.key, supportColumn?.key],
  )
  const filteredRecords = records.filter((record) => {
    const term = deferredSearch.trim().toLowerCase()
    if (!term) return true
    return config.searchableKeys.some((key) => String(record[key] ?? '').toLowerCase().includes(term))
  })

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const payload = serializeForm(config, form)
      await saveRecord(config.collection, {
        ...payload,
        id: editing?.id as string | undefined,
      } as never)
      showNotice({
        tone: 'success',
        title: editing ? 'Registro atualizado' : 'Registro criado',
        message: `${config.singularLabel} salvo com sucesso.`,
      })
      setOpen(false)
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Deseja remover este ${config.singularLabel}?`)) return
    try {
      await deleteRecord(config.collection, id)
      showNotice({ tone: 'success', title: 'Registro removido', message: `${config.singularLabel} removido com sucesso.` })
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao remover', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  function renderCell(columnKey: string, value: unknown) {
    const field = config.fields.find((item) => item.key === columnKey)
    if (field?.relation) {
      return resolveLabel(field.relation.collection, String(value || ''), field.relation.labelKey)
    }
    if (columnKey.toLowerCase().includes('valor') || columnKey === 'total' || columnKey === 'subtotal') {
      return formatCurrency(Number(value || 0))
    }
    if (field?.type === 'date' || columnKey.toLowerCase().includes('data')) {
      return formatDate(String(value || ''))
    }
    if (field?.type === 'checkbox') {
      return value ? 'Sim' : 'Não'
    }
    return String(value ?? '-')
  }

  return (
    <section className="module-card">
      <div className="module-heading module-toolbar">
        <div className="summary-grid compact module-summary-grid">
          <article className="metric-card">
            <span>Total</span>
            <strong>{records.length}</strong>
          </article>
          <article className="metric-card">
            <span>Filtrados</span>
            <strong>{filteredRecords.length}</strong>
          </article>
        </div>
        <div className="module-toolbar-actions">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar..."
            total={filteredRecords.length}
          />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={openCreate}>
            Novo registro
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? <div className="empty-state">Nenhum registro encontrado para este módulo.</div> : null}

      {filteredRecords.length > 0 && viewMode === 'list' ? (
        <div className="table-shell">
          <div className="table-head table-row-grid">
            {config.columns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
            <span>Ações</span>
          </div>
          {filteredRecords.map((record) => (
            <div key={String(record.id)} className="table-row table-row-grid">
              {config.columns.map((column) => (
                <div key={column.key}>
                  {column.type === 'status' ? <StatusPill label={String(record[column.key] ?? '-')} /> : renderCell(column.key, record[column.key])}
                </div>
              ))}
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => openEdit(record)}>
                  Editar
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(String(record.id))}>
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
                  <h3>{renderCell(primaryColumn.key, record[primaryColumn.key])}</h3>
                  {supportColumn ? <p className="record-support">{supportColumn.label}: {renderCell(supportColumn.key, record[supportColumn.key])}</p> : null}
                </div>
                {statusColumn ? <StatusPill label={String(record[statusColumn.key] ?? '-')} /> : <span className="record-identity">{String(record.id ?? '-')}</span>}
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>ID</span>
                  <strong>{String(record.id ?? '-')}</strong>
                </div>
                {cardColumns.map((column) => (
                  <div key={column.key} className="record-stat">
                    <span>{column.label}</span>
                    <strong>{renderCell(column.key, record[column.key])}</strong>
                  </div>
                ))}
              </div>
              <div className="record-card-actions">
                <button className="ghost-button" type="button" onClick={() => openEdit(record)}>
                  Editar
                </button>
                <button className="ghost-button danger" type="button" onClick={() => handleDelete(String(record.id))}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal open={open} title={editing ? `Editar ${config.singularLabel}` : `Novo ${config.singularLabel}`} onClose={() => setOpen(false)}>
        <form className="editor-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            {config.fields.map((field) => {
              const options = field.type === 'relation' && field.relation
                ? (((collections[field.relation.collection] ?? []) as unknown as Array<Record<string, unknown>>).map((item) => ({
                    label: String(item[field.relation!.labelKey] ?? item.id),
                    value: String(item.id),
                  })))
                : (field.options ?? [])

              return (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  options={options}
                  onChange={(next) => setForm((current) => ({ ...current, [field.key]: next }))}
                />
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
    </section>
  )
}

export function resolveCollectionLabel(config: EntityConfig, collection: CollectionName) {
  return config.collection === collection
}