import { formatCurrency, formatDate } from '@atlasmed/shared'
import { useEffect, useMemo, useState } from 'react'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useCompanyProfile } from '../hooks/useCompanyProfile'
import { useModuleViewMode } from '../hooks/useModuleViewMode'
import { fmtDate, fmtMoney, printGenericDocument } from '../lib/pdf'

export function FinanceModule() {
  const { collections, ensureCollections, resolveLabel } = useAppData()
  const company = useCompanyProfile()
  const [search, setSearch] = useState('')
  const { viewMode, setViewMode } = useModuleViewMode('financeiro')

  useEffect(() => {
    void ensureCollections(['orcamentos', 'contratos', 'ordensServico', 'historicoOS', 'clientes'])
  }, [ensureCollections])

  const budgets = collections.orcamentos ?? []
  const contracts = collections.contratos ?? []
  const serviceOrders = [...(collections.ordensServico ?? []), ...(collections.historicoOS ?? [])]

  const feed = useMemo(() => {
    const budgetRows = budgets.map((budget) => ({
      id: budget.id,
      type: 'Orçamento',
      client: resolveLabel('clientes', budget.clienteId, 'nome'),
      status: budget.status,
      date: budget.data,
      value: Number(budget.total || 0),
    }))
    const contractRows = contracts.map((contract) => ({
      id: contract.id,
      type: 'Contrato',
      client: resolveLabel('clientes', contract.clienteId, 'nome'),
      status: contract.status,
      date: contract.inicioVigencia,
      value: Number(contract.valorMensal || 0),
    }))
    const serviceRows = serviceOrders.map((order) => ({
      id: order.id,
      type: 'OS',
      client: resolveLabel('clientes', order.clienteId, 'nome'),
      status: order.status,
      date: order.data,
      value: Number((order.fechamento as { pecasUsadas?: Array<{ quantidade?: number }> } | undefined)?.pecasUsadas?.length || 0) * 120,
    }))
    return [...budgetRows, ...contractRows, ...serviceRows]
      .filter((row) => !search || `${row.id} ${row.client} ${row.status} ${row.type}`.toLowerCase().includes(search.toLowerCase()))
      .sort((left, right) => String(right.date).localeCompare(String(left.date)))
  }, [budgets, contracts, resolveLabel, search, serviceOrders])

  const activeContractsRevenue = contracts.filter((item) => item.status === 'Ativo').reduce((total, item) => total + Number(item.valorMensal || 0), 0)
  const approvedBudgets = budgets.filter((item) => item.status === 'Aprovado').reduce((total, item) => total + Number(item.total || 0), 0)

  function handlePrintReport() {
    const totalGeral = feed.reduce((total, row) => total + Number(row.value || 0), 0)
    printGenericDocument({
      company,
      documentLabel: 'Relatório Financeiro',
      title: 'Consolidado de lançamentos',
      groups: [
        {
          title: 'Indicadores',
          rows: [
            { label: 'Receita mensal ativa (contratos)', value: fmtMoney(activeContractsRevenue) },
            { label: 'Contratos ativos', value: String(contracts.filter((item) => item.status === 'Ativo').length) },
            { label: 'Orçamentos aprovados', value: fmtMoney(approvedBudgets) },
            { label: 'Propostas aprovadas', value: String(budgets.filter((item) => item.status === 'Aprovado').length) },
            { label: 'Total de lançamentos', value: fmtMoney(totalGeral) },
          ],
        },
      ],
      tables: feed.length
        ? [
            {
              title: 'Lançamentos',
              head: ['Tipo', 'Código', 'Cliente', 'Data', 'Status', 'Valor'],
              rows: feed.map((row) => [row.type, String(row.id), row.client, fmtDate(row.date), String(row.status), fmtMoney(row.value)]),
            },
          ]
        : undefined,
    })
  }

  return (
    <section className="module-card">
      <div className="summary-grid">
        <article className="metric-card success">
          <span>Receita mensal ativa</span>
          <strong>{formatCurrency(activeContractsRevenue)}</strong>
          <small>{contracts.filter((item) => item.status === 'Ativo').length} contratos ativos</small>
        </article>
        <article className="metric-card accent">
          <span>Orçamentos aprovados</span>
          <strong>{formatCurrency(approvedBudgets)}</strong>
          <small>{budgets.filter((item) => item.status === 'Aprovado').length} propostas aprovadas</small>
        </article>
      </div>

      <div className="module-heading module-toolbar">
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por cliente, tipo ou status..." total={feed.length} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={handlePrintReport}>
            Relatório PDF
          </button>
        </div>
      </div>

      {feed.length === 0 ? <div className="empty-state">Nenhum lançamento financeiro encontrado.</div> : null}

      {feed.length > 0 && viewMode === 'list' ? (
        <div className="table-shell finance-grid">
          <div className="table-head finance-row">
            <span>Tipo</span>
            <span>Código</span>
            <span>Cliente</span>
            <span>Data</span>
            <span>Status</span>
            <span>Valor</span>
          </div>
          {feed.map((entry) => (
            <div key={`${entry.type}-${entry.id}`} className="table-row finance-row">
              <span>{entry.type}</span>
              <strong>{entry.id}</strong>
              <span>{entry.client}</span>
              <span>{formatDate(entry.date)}</span>
              <StatusPill label={entry.status} />
              <span>{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {feed.length > 0 && viewMode === 'grid' ? (
        <div className="record-grid">
          {feed.map((entry) => (
            <article key={`${entry.type}-${entry.id}`} className="record-card">
              <div className="record-card-head">
                <div>
                  <p className="record-kicker">{entry.type}</p>
                  <h3>{entry.client}</h3>
                  <p className="record-support">{entry.id}</p>
                </div>
                <StatusPill label={entry.status} />
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>Data</span>
                  <strong>{formatDate(entry.date)}</strong>
                </div>
                <div className="record-stat">
                  <span>Valor</span>
                  <strong>{formatCurrency(entry.value)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}