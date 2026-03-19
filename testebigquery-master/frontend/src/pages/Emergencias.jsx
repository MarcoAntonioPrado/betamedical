import Chart from 'react-apexcharts'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import ChartCard from '../components/ChartCard'
import Spinner, { ErrorMessage } from '../components/Spinner'
import { chartBase, COLORS } from '../lib/chartDefaults'

export default function Emergencias() {
  const { data, loading, error } = useQuery({ motivosEmergencia: api.motivosEmergencia })

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { motivosEmergencia } = data
  const fmt = n => Number(n ?? 0).toLocaleString('pt-BR')

  const sorted = [...motivosEmergencia].sort((a, b) => Number(b.total) - Number(a.total))

  return (
    <div className="space-y-5">
      <ChartCard title="Top 10 Motivos de Atendimento Emergencial" badge="Mais frequentes">
        <Chart
          type="bar"
          height={420}
          options={{
            chart: { ...chartBase, type: 'bar' },
            colors: [COLORS.coral],
            plotOptions: {
              bar: { borderRadius: 5, horizontal: true, barHeight: '62%' },
            },
            xaxis: {
              categories: sorted.map(r => r.motivo_atendimento),
              labels: { formatter: v => fmt(v), style: { colors: '#94a3b8' } },
            },
            yaxis: {
              labels: {
                maxWidth: 280,
                style: { fontSize: '12px', colors: '#475569' },
              },
            },
            tooltip: { y: { formatter: v => fmt(v) + ' atendimentos' } },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
            dataLabels: {
              enabled: true,
              formatter: v => fmt(v),
              style: { fontSize: '11px', fontWeight: 700 },
              offsetX: 4,
            },
          }}
          series={[{ name: 'Atendimentos', data: sorted.map(r => Number(r.total)) }]}
        />
      </ChartCard>

      {/* Tabela resumo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Detalhamento por Motivo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Atendimentos</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((r, i) => {
                const total = sorted.reduce((s, x) => s + Number(x.total), 0)
                const pct   = total > 0 ? ((Number(r.total) / total) * 100).toFixed(1) : '0.0'
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700">{r.motivo_atendimento}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(r.total)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
