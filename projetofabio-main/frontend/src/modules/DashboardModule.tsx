import { formatCurrency, formatDate } from '@atlasmed/shared'
import { useEffect, useMemo } from 'react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../contexts/AppDataContext'

const DAYS_30 = 30 * 24 * 60 * 60 * 1000

function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false
  try {
    const diff = new Date(dateStr).getTime() - Date.now()
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function DashboardModule() {
  const { collections, ensureCollections, resolveLabel } = useAppData()

  useEffect(() => {
    void ensureCollections(['equipamentos', 'ordensServico', 'historicoOS', 'contratos', 'orcamentos', 'pecas', 'acessorios', 'padroesCalibracao', 'certificados'])
  }, [ensureCollections])

  const equipamentos = collections.equipamentos ?? []
  const ordens = collections.ordensServico ?? []
  const contratos = collections.contratos ?? []
  const orcamentos = collections.orcamentos ?? []
  const pecas = collections.pecas ?? []
  const acessorios = collections.acessorios ?? []
  const padroes = collections.padroesCalibracao ?? []
  const certificados = collections.certificados ?? []

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

  // Certificate / equipment alerts
  const expiringCalibrations = useMemo(
    () => equipamentos.filter((eq) => isWithinDays(eq.proximaCalibracao, 30)),
    [equipamentos],
  )
  const duePM = useMemo(
    () => equipamentos.filter((eq) => isWithinDays(eq.proximaManutencaoPreventiva, 30)),
    [equipamentos],
  )
  const certThisMonth = useMemo(() => {
    const now = new Date()
    return certificados.filter((c) => {
      try {
        const d = new Date(c.data)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      } catch {
        return false
      }
    }).length
  }, [certificados])

  const totalAlerts = expiringCalibrations.length + duePM.length + expiringPatterns.length

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
        <article className={totalAlerts > 0 ? 'metric-card warning' : 'metric-card'}>
          <span>Alertas de certificação</span>
          <strong>{totalAlerts}</strong>
          <small>{expiringCalibrations.length} calibrações · {duePM.length} PM · {expiringPatterns.length} padrões</small>
        </article>
        <article className="metric-card">
          <span>Certificados este mês</span>
          <strong>{certThisMonth}</strong>
          <small>{certificados.length} no total</small>
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
          {ordens.length === 0 && <p className="feed-empty">Nenhuma ordem aberta.</p>}
        </section>

        <section className="panel-block">
          <div className="panel-heading">
            <strong>Calibrações vencendo (30 dias)</strong>
            <span>{expiringCalibrations.length} equipamentos</span>
          </div>
          {expiringCalibrations.slice(0, 5).map((eq) => (
            <article key={eq.id} className="feed-card">
              <div>
                <strong>{eq.nome}</strong>
                <p>{eq.tag ? `[${eq.tag}] ` : ''}{eq.setor ?? eq.local}</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>{formatDate(eq.proximaCalibracao)}</span>
            </article>
          ))}
          {expiringCalibrations.length === 0 && <p className="feed-empty">Nenhuma calibração próxima.</p>}
        </section>

        <section className="panel-block">
          <div className="panel-heading">
            <strong>PM programadas (30 dias)</strong>
            <span>{duePM.length} equipamentos</span>
          </div>
          {duePM.slice(0, 5).map((eq) => (
            <article key={eq.id} className="feed-card">
              <div>
                <strong>{eq.nome}</strong>
                <p>{eq.tag ? `[${eq.tag}] ` : ''}{eq.setor ?? eq.local}</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>{formatDate(eq.proximaManutencaoPreventiva)}</span>
            </article>
          ))}
          {duePM.length === 0 && <p className="feed-empty">Nenhuma PM próxima.</p>}
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
          {lowStock.length === 0 && <p className="feed-empty">Estoque dentro dos limites.</p>}
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
                <p>Validade: {formatDate(pattern.validadeCalibracao)}</p>
              </div>
              <StatusPill label={pattern.status} />
            </article>
          ))}
          {expiringPatterns.length === 0 && <p className="feed-empty">Todos os padrões vigentes.</p>}
        </section>
      </div>
    </section>
  )
}