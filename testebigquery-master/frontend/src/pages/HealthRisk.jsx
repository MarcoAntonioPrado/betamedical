import Chart from 'react-apexcharts'
import { Heart, Droplet, Microscope, Pill, Wind, Scale } from 'lucide-react'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import Spinner, { ErrorMessage } from '../components/Spinner'
import { chartBase, fmt, COLORS } from '../lib/chartDefaults'

export default function HealthRisk() {
  const { data, loading, error } = useQuery({
    resumo:         api.resumo,
    condicoesSaude: api.condicoesSaude,
    areaProgratica: api.areaProgratica,
    categoriasRisco:api.categoriasRisco,
  })

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { resumo, condicoesSaude, areaProgratica, categoriasRisco } = data
  const fmt = n => Number(n ?? 0).toLocaleString('pt-BR')
  const cond = (label) => condicoesSaude.find(c => c.label === label)

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Hipertensão"  value={fmt(resumo.com_hipertensao)}           color="red"    icon={Heart}       />
        <KPICard label="Diabetes"     value={fmt(resumo.com_diabetes)}               color="yellow" icon={Droplet}     />
        <KPICard label="Sífilis"      value={fmt(resumo.com_sifilis)}                color="pink"   icon={Microscope}  />
        <KPICard label="HIV"          value={fmt(resumo.com_hiv)}                    color="purple" icon={Pill}        />
        <KPICard label="Tuberculose"  value={fmt(cond('Tuberculose')?.total ?? 0)}   color="orange" icon={Wind}        />
        <KPICard label="Obesidade"    value={fmt(cond('Obesidade')?.total ?? 0)}     color="orange" icon={Scale}       />
      </div>

      {/* Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Condições de Saúde — Comparativo">
          <Chart
            type="bar"
            height={280}
            options={{
              chart: { ...chartBase, type: 'bar' },
              colors: [COLORS.coral,'#f59e0b',COLORS.health,'#8b5cf6','#06b6d4','#f97316',COLORS.primary],
              plotOptions: { bar: { borderRadius: 5, horizontal: true, distributed: true, barHeight: '68%' } },
              xaxis: { categories: condicoesSaude.map(c => c.label), labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } } },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
              legend: { show: false },
              grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
              dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontWeight: 600 } },
            }}
            series={[{ data: condicoesSaude.map(c => c.total) }]}
          />
        </ChartCard>

        <ChartCard title="Gestantes por Área Programática">
          <Chart
            type="bar"
            height={280}
            options={{
              chart: { ...chartBase, type: 'bar' },
              colors: [COLORS.primary],
              plotOptions: { bar: { borderRadius: 5, columnWidth: '58%' } },
              xaxis: { categories: areaProgratica.map(r => r.area_programatica), labels: { style: { fontSize: '12px', colors: '#94a3b8' } } },
              yaxis: { labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } } },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
              grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
              dataLabels: { enabled: false },
            }}
            series={[{ name: 'Gestantes', data: areaProgratica.map(r => Number(r.total)) }]}
          />
        </ChartCard>
      </div>

      {/* Categorias de risco */}
      <ChartCard title="Categorias de Risco" badge="Top 15">
        <Chart
          type="bar"
          height={380}
          options={{
            chart: { ...chartBase, type: 'bar' },
            colors: [COLORS.accent],
            plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '65%' } },
            xaxis: {
              categories: categoriasRisco.map(r => r.categoria_risco),
              labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } },
            },
            tooltip: { y: { formatter: v => fmt(v) + ' ocorrências' } },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
            dataLabels: {
              enabled: true,
              formatter: v => fmt(v),
              style: { fontSize: '11px', fontWeight: 600 },
              offsetX: 4,
            },
          }}
          series={[{ name: 'Ocorrências', data: categoriasRisco.map(r => Number(r.total)) }]}
        />
      </ChartCard>
    </div>
  )
}
