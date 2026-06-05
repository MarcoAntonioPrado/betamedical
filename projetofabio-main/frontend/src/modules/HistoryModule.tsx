import { formatDate } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../contexts/AppDataContext'
import { useCompanyProfile } from '../hooks/useCompanyProfile'
import { useModuleViewMode } from '../hooks/useModuleViewMode'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { printServiceOrderDocument } from '../lib/pdf'

export function HistoryModule() {
  const { collections, ensureCollections, resolveLabel } = useAppData()
  const company = useCompanyProfile()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const { viewMode, setViewMode } = useModuleViewMode('historico-os')

  useEffect(() => {
    void ensureCollections(['historicoOS', 'clientes', 'equipamentos', 'funcionarios', 'pecas', 'acessorios'])
  }, [ensureCollections])

  const history = useMemo(
    () => [...(collections.historicoOS ?? [])].sort((left, right) => String(right.fechadoEm ?? '').localeCompare(String(left.fechadoEm ?? ''))),
    [collections.historicoOS],
  )
  const filtered = history.filter((item) => !search || `${item.id} ${item.descricao} ${item.status}`.toLowerCase().includes(search.toLowerCase()))

  function handlePrint(order: Record<string, unknown>) {
    const cliente = (collections.clientes ?? []).find((item) => item.id === order.clienteId) as Record<string, unknown> | undefined
    const equipamento = (collections.equipamentos ?? []).find((item) => item.id === order.equipamentoId) as Record<string, unknown> | undefined
    printServiceOrderDocument({
      company,
      order,
      cliente,
      equipamento,
      tecnicoNome: order.funcionarioId ? resolveLabel('funcionarios', String(order.funcionarioId), 'nome') : '',
      resolveItemName: (id) => resolveLabel('pecas', id, 'nome'),
      isHistory: true,
    })
  }

  return (
    <section className="module-card">
      <div className="module-heading module-toolbar">
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por código ou descrição..." total={filtered.length} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {filtered.length === 0 ? <div className="empty-state">Nenhum histórico encontrado.</div> : null}

      {filtered.length > 0 && viewMode === 'list' ? (
        <div className="table-shell history-grid">
          <div className="table-head history-row">
            <span>OS</span>
            <span>Cliente</span>
            <span>Equipamento</span>
            <span>Fechamento</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {filtered.map((item) => (
            <div key={item.id} className="table-row history-row">
              <span>{item.id}</span>
              <span>{resolveLabel('clientes', item.clienteId, 'nome')}</span>
              <span>{resolveLabel('equipamentos', item.equipamentoId, 'nome')}</span>
              <span>{formatDate(item.fechadoEm)}</span>
              <StatusPill label={item.status} />
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => setDetail(item as unknown as Record<string, unknown>)}>
                  Ver detalhes
                </button>
                <button className="ghost-button" type="button" onClick={() => handlePrint(item as unknown as Record<string, unknown>)}>
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 && viewMode === 'grid' ? (
        <div className="record-grid">
          {filtered.map((item) => (
            <article key={item.id} className="record-card">
              <div className="record-card-head">
                <div>
                  <p className="record-kicker">Histórico</p>
                  <h3>{item.id}</h3>
                  <p className="record-support">{resolveLabel('clientes', item.clienteId, 'nome')}</p>
                </div>
                <StatusPill label={item.status} />
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>Equipamento</span>
                  <strong>{resolveLabel('equipamentos', item.equipamentoId, 'nome')}</strong>
                </div>
                <div className="record-stat">
                  <span>Fechamento</span>
                  <strong>{formatDate(item.fechadoEm)}</strong>
                </div>
              </div>
              <div className="record-card-actions">
                <button className="ghost-button" type="button" onClick={() => setDetail(item as unknown as Record<string, unknown>)}>
                  Ver detalhes
                </button>
                <button className="ghost-button" type="button" onClick={() => handlePrint(item as unknown as Record<string, unknown>)}>
                  PDF
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal open={Boolean(detail)} title={`Detalhes ${String(detail?.id ?? '')}`} onClose={() => setDetail(null)}>
        {detail ? (
          <div className="detail-grid">
            <article>
              <strong>Cliente</strong>
              <p>{resolveLabel('clientes', String(detail.clienteId ?? ''), 'nome')}</p>
            </article>
            <article>
              <strong>Equipamento</strong>
              <p>{resolveLabel('equipamentos', String(detail.equipamentoId ?? ''), 'nome')}</p>
            </article>
            <article>
              <strong>Técnico</strong>
              <p>{resolveLabel('funcionarios', String(detail.funcionarioId ?? ''), 'nome')}</p>
            </article>
            <article className="full">
              <strong>Descrição</strong>
              <p>{String(detail.descricao ?? '-')}</p>
            </article>
            <article className="full">
              <strong>Ação executada</strong>
              <p>{String((detail.fechamento as { acao?: string } | undefined)?.acao ?? '-')}</p>
            </article>
            <article className="full">
              <strong>Diagnóstico</strong>
              <p>{String((detail.fechamento as { problema?: string } | undefined)?.problema ?? '-')}</p>
            </article>
          </div>
        ) : null}
        {detail ? (
          <div className="modal-actions">
            <button className="primary-button" type="button" onClick={() => handlePrint(detail)}>
              Gerar PDF
            </button>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}