import { formatCurrency } from '@atlasmed/shared'
import { useEffect, useMemo } from 'react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../contexts/AppDataContext'

export function DashboardModule() {
  const { collections, ensureCollections, resolveLabel } = useAppData()

  useEffect(() => {
    void ensureCollections(['equipamentos', 'ordensServico', 'historicoOS', 'contratos', 'orcamentos', 'pecas', 'acessorios', 'padroesCalibracao'])
  }, [ensureCollections])

  const equipamentos = collections.equipamentos ?? []
  const ordens = collections.ordensServico ?? []
  const contratos = collections.contratos ?? []
  const orcamentos = collections.orcamentos ?? []
  const pecas = collections.pecas ?? []
  const acessorios = collections.acessorios ?? []
  const padroes = collections.padroesCalibracao ?? []

  const recurringRevenue = useMemo(
    () => contratos.filter((item) => item.status === 'Ativo').reduce((total, item) => total + Number(item.valorMensal || 0), 0),
    [contratos],
  )
  const pipelineValue = useMemo(
    () => orcamentos.filter((item) => item.status === 'Enviado' || item.status === 'Aprovado').reduce((total, item) => total + Number(item.total || 0), 0),
    [orcamentos],
  )
  const lowStock = [...pecas, ...acessorios].filter((item) => Number(item.quantidade || 0) <= Number(item.minimo || 0))
  const expiringPatterns = padroes.filter((item) => item.status !== 'Válido')

  return (
    <section className="module-card">
      <div className="summary-grid">
        <article className="metric-card accent">
          <span>Equipamentos ativos</span>
          <strong>{equipamentos.length}</strong>
          <small>{equipamentos.filter((item) => item.status === 'Em Operação').length} em operação</small>
        </article>
        <article className="metric-card warm">
          <span>Ordens abertas</span>
          <strong>{ordens.length}</strong>
          <small>{ordens.filter((item) => item.status === 'Aguardando Peça').length} aguardando peça</small>
        </article>
        <article className="metric-card success">
          <span>Receita mensal ativa</span>
          <strong>{formatCurrency(recurringRevenue)}</strong>
          <small>{contratos.filter((item) => item.status === 'Ativo').length} contratos em vigor</small>
        </article>
        <article className="metric-card">
          <span>Pipeline comercial</span>
          <strong>{formatCurrency(pipelineValue)}</strong>
          <small>{orcamentos.length} propostas no radar</small>
        </article>
      </div>

      <div className="split-grid">
        <section className="panel-block">
          <div className="panel-heading">
            <strong>Ordens em andamento</strong>
            <span>{ordens.length} registros</span>
          </div>
          {ordens.slice(0, 5).map((order) => (
            <article key={order.id} className="feed-card">
              <div>
                <strong>{order.id}</strong>
                <p>{order.descricao}</p>
                <small>{resolveLabel('equipamentos', order.equipamentoId, 'nome')}</small>
              </div>
              <StatusPill label={order.status} />
            </article>
          ))}
        </section>
        <section className="panel-block">
          <div className="panel-heading">
            <strong>Estoque crítico</strong>
            <span>{lowStock.length} itens</span>
          </div>
          {lowStock.slice(0, 5).map((item) => (
            <article key={item.id} className="feed-card">
              <div>
                <strong>{item.nome}</strong>
                <p>{item.id}</p>
              </div>
              <span>{item.quantidade}/{item.minimo}</span>
            </article>
          ))}
        </section>
        <section className="panel-block">
          <div className="panel-heading">
            <strong>Padrões para acompanhar</strong>
            <span>{expiringPatterns.length} alertas</span>
          </div>
          {expiringPatterns.slice(0, 5).map((pattern) => (
            <article key={pattern.id} className="feed-card">
              <div>
                <strong>{pattern.nome}</strong>
                <p>Validade: {pattern.validadeCalibracao}</p>
              </div>
              <StatusPill label={pattern.status} />
            </article>
          ))}
        </section>
      </div>
    </section>
  )
}