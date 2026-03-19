import Chart from 'react-apexcharts'
import { Stethoscope, Clock } from 'lucide-react'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import Spinner, { ErrorMessage } from '../components/Spinner'
import { chartBase, COLORS } from '../lib/chartDefaults'

const PALETTE = [COLORS.primary, '#8b5cf6', COLORS.coral, '#f59e0b', COLORS.health]

export default function Prenatal() {
  const { data, loading, error } = useQuery({
    resumo:            api.resumo,
    consultasPrenatal: api.consultasPrenatal,
    tipoParto:         api.tipoParto,
    adequacaoAas:      api.adequacaoAas,
  })

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { resumo, consultasPrenatal, tipoParto, adequacaoAas } = data
  const fmt = n => Number(n ?? 0).toLocaleString('pt-BR')

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <KPICard label="Média de Consultas" value={Number(resumo.media_consultas).toFixed(1)} desc="pré-natal" color="green" icon={Stethoscope} />
        <KPICard label="Sem Atend. 30d"    value={fmt(resumo.sem_atd_30_dias)}                color="yellow" icon={Clock} />
      </div>

      {/* Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Número de Consultas Pré-natal por Gestante">
          <Chart
            type="bar"
            height={260}
            options={{
              chart: { ...chartBase, type: 'bar' },
              colors: [COLORS.health],
              plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
              xaxis: {
                categories: consultasPrenatal.map(r => r.faixa_consultas),
                labels: { style: { fontSize: '12px', colors: '#94a3b8' } },
              },
              yaxis: { labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } } },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
              grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
              dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '11px', fontWeight: 600 } },
            }}
            series={[{ name: 'Gestantes', data: consultasPrenatal.map(r => Number(r.total)) }]}
          />
        </ChartCard>

        <ChartCard title="Tipo de Parto">
          <Chart
            type="donut"
            height={260}
            options={{
              chart: chartBase,
              colors: PALETTE,
              labels: tipoParto.map(r => r.tipo),
              legend: { position: 'bottom', fontSize: '12px', fontFamily: 'inherit' },
              plotOptions: { pie: { donut: { size: '55%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 600 } } } } },
              tooltip: { y: { formatter: v => fmt(v) + ' partos' } },
              dataLabels: { formatter: (_, opts) => fmt(opts.w.globals.series[opts.seriesIndex]) },
            }}
            series={tipoParto.map(r => Number(r.total))}
          />
        </ChartCard>
      </div>

      {/* AAS */}
      <ChartCard title="Adequação AAS — Prevenção de Pré-eclâmpsia">
        <Chart
          type="bar"
          height={240}
          options={{
            chart: { ...chartBase, type: 'bar' },
            colors: [COLORS.primary],
            plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: '60%' } },
            xaxis: {
              categories: adequacaoAas.map(r => r.adequacao),
              labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } },
            },
            tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
            dataLabels: {
              enabled: true,
              formatter: v => fmt(v),
              style: { fontSize: '11px', fontWeight: 600 },
              offsetX: 4,
            },
          }}
          series={[{ name: 'Gestantes', data: adequacaoAas.map(r => Number(r.total)) }]}
        />
      </ChartCard>
    </div>
  )
}
