import Chart from 'react-apexcharts'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'
import SectionTitle from '../components/SectionTitle'
import Footer from '../components/Footer'
import { chartBase, fmt, COLORS } from '../lib/chartDefaults'

const TRIM_ORDER  = ['1\u00ba trimestre','2\u00ba trimestre','3\u00ba trimestre']
const TRIM_COLORS = [COLORS.coral, '#f472b6', '#fda4af']
const RACA_COLOR  = COLORS.primary

function GaugeRow({ label, pct, count, color }) {
  const v = Math.min(Number(pct) || 0, 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">({fmt(count)})</span>
          <span className="text-sm font-bold" style={{ color }}>{fmt(pct, 1)}%</span>
        </div>
      </div>
      <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  )
}

export default function Sifilis({ onListagem }) {
  const { data, loading, error } = useQuery({
    kpis:      api.sifilisKpis,
    trimestre: api.sifilisTrimestreTx,
    statusTx:  api.sifilisStatusTratamento,
    raca:      api.sifilisRaca,
    ap:        api.sifilisAp,
  })

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { kpis, trimestre, statusTx, raca, ap } = data

  const trimSorted = [...trimestre].sort(
    (a, b) => TRIM_ORDER.indexOf(a.trimestre) - TRIM_ORDER.indexOf(b.trimestre)
  )
  const totalTrim = trimSorted.reduce((s, r) => s + Number(r.total), 0)

  const totalStatus = statusTx.reduce((s, r) => s + Number(r.total), 0)
  const findStatus = (label) => {
    const r = statusTx.find(s => s.status_pep === label)
    return r ? Number(r.total) : 0
  }
  const nAdequado     = findStatus('Adequado')
  const nInadequado   = findStatus('Inadequado')
  const nEmTratamento = findStatus('Em tratamento')

  const racaTotal = raca.reduce((s, r) => s + Number(r.total), 0)

  return (
    <div className="space-y-5 pb-4">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #0f172a, #12305a, #183d72)' }}>
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1">Gestantes com S&iacute;filis</p>
            <p className="text-6xl font-black text-white leading-none tracking-tight">{fmt(kpis.total)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[120px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">Com diagn&oacute;stico<br/>associado</p>
              <p className="text-2xl font-extrabold text-white">{fmt(kpis.com_diagnostico)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[120px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">Sem diagn&oacute;stico<br/>associado</p>
              <p className="text-2xl font-extrabold text-white">{fmt(kpis.sem_diagnostico)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA PRINCIPAL */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* COLUNA ESQUERDA */}
        <div className="col-span-3 space-y-4">

          {/* VDRL */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-teal-600">Exames VDRL</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                <div>
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest leading-tight">VDRL Diagn&oacute;stico</p>
                  <p className="text-2xl font-black text-teal-700 leading-none">{fmt(kpis.vdrl_diagnostico)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">VDRL Acompanhamento</p>
                  <p className="text-2xl font-black text-slate-700 leading-none">{fmt(kpis.vdrl_acompanhamento)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tratamento gestante */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-teal-600">Tratamento completo &ndash; Gestante</SectionTitle>
            <div className="text-center py-2">
              <p className="text-4xl font-black text-teal-700 leading-none">
                {fmt(kpis.pct_tx_gestante, 1)}<span className="text-xl font-bold">%</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">({fmt(kpis.tx_gestante_completo)} gestantes)</p>
            </div>
            <div className="bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-1000"
                style={{ width: `${Math.min(Number(kpis.pct_tx_gestante) || 0, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">*Completo (3+ doses dispensadas no PEP)</p>
          </div>

          {/* Tratamento parceria */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-gov-500">Tratamento da Parceria</SectionTitle>
            <div className="text-center py-2">
              <p className="text-4xl font-black text-gov-700 leading-none">
                {fmt(kpis.pct_tx_parceria, 1)}<span className="text-xl font-bold">%</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">({fmt(kpis.tx_parceria_efetuado)} parceiros)</p>
            </div>
            <div className="bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gov-400 to-gov-600 transition-all duration-1000"
                style={{ width: `${Math.min(Number(kpis.pct_tx_parceria) || 0, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">*Parceiro com tratamento efetuado registrado no PEP</p>
          </div>
        </div>

        {/* COLUNA CENTRAL */}
        <div className="col-span-5 space-y-4">

          {/* Trimestre do inicio do tratamento */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-teal-600">Trimestre do in&iacute;cio do tratamento*</SectionTitle>
            <div className="flex items-center gap-4">
              {trimSorted.length > 0 && (
                <div className="flex-1">
                  <Chart
                    type="donut"
                    height={200}
                    options={{
                      chart: { ...chartBase, type: 'donut' },
                      colors: TRIM_COLORS,
                      labels: trimSorted.map(r => r.trimestre),
                      legend: { show: false },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '65%',
                            labels: {
                              show: true,
                              total: {
                                show: true,
                                label: 'Total',
                                fontSize: '11px',
                                color: '#94a3b8',
                                fontWeight: 600,
                                formatter: () => fmt(totalTrim),
                              },
                              value: { fontSize: '20px', fontWeight: 800, color: '#1e293b' },
                            },
                          },
                        },
                      },
                      dataLabels: { enabled: false },
                      stroke: { width: 2, colors: ['#fff'] },
                      tooltip: { y: { formatter: v => fmt(v) + ' casos' } },
                    }}
                    series={trimSorted.map(r => Number(r.total))}
                  />
                </div>
              )}
              <div className="space-y-2 min-w-[150px]">
                {trimSorted.map((r, i) => {
                  const pct = totalTrim > 0 ? (Number(r.total) / totalTrim * 100).toFixed(1) : '0.0'
                  return (
                    <div key={r.trimestre} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TRIM_COLORS[i] }} />
                        <span className="text-xs text-slate-600 font-medium">{r.trimestre}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">*Trimestre calculado pela IG no in&iacute;cio do tratamento (PEP).</p>
          </div>

          {/* Status tratamento no PEP */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-teal-600">Status do tratamento no PEP (%)</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Adequado',      n: nAdequado,     bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
                { label: 'Inadequado',    n: nInadequado,   bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700'    },
                { label: 'Em tratamento', n: nEmTratamento, bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700'   },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3.5 border text-center ${s.bg}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1">{s.label}</p>
                  <p className={`text-2xl font-black leading-none ${s.text}`}>
                    {totalStatus > 0 ? (s.n / totalStatus * 100).toFixed(2) : '0.00'}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fmt(s.n)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Distribuicao por AP */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-teal-600">Distribui&ccedil;&atilde;o de casos por AP</SectionTitle>
            <Chart
              type="bar"
              height={210}
              options={{
                chart: { ...chartBase, type: 'bar' },
                colors: [COLORS.coral],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shade: 'light', type: 'vertical', shadeIntensity: 0.3,
                    gradientToColors: ['#f472b6'], opacityFrom: 1, opacityTo: 0.8,
                  },
                },
                xaxis: {
                  categories: ap.map(r => r.ap),
                  labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                },
                yaxis: { labels: { show: false } },
                grid: { show: false },
                dataLabels: {
                  enabled: true,
                  formatter: v => fmt(v),
                  offsetY: -7,
                  style: { fontSize: '9px', colors: ['#0d9488'], fontWeight: 700 },
                },
                tooltip: { y: { formatter: v => fmt(v) + ' casos' } },
              }}
              series={[{ name: 'Casos no PEP', data: ap.map(r => Number(r.total)) }]}
            />
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-4 space-y-4">

          {/* Raca/cor */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle>Ra&ccedil;a / Cor</SectionTitle>
            {raca.length > 0 && (
              <Chart
                type="bar"
                height={220}
                options={{
                  chart: { ...chartBase, type: 'bar' },
                  colors: [RACA_COLOR],
                  plotOptions: {
                    bar: { horizontal: true, barHeight: '55%', borderRadius: 4 },
                  },
                  xaxis: {
                    categories: raca.map(r => r.raca),
                    labels: { show: false },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: {
                    labels: { style: { fontSize: '12px', colors: '#475569', fontWeight: 600 } },
                  },
                  grid: { show: false },
                  dataLabels: {
                    enabled: true,
                    formatter: (v) => {
                      const pct = racaTotal > 0 ? (v / racaTotal * 100).toFixed(2) : '0'
                      return `${pct}%`
                    },
                    style: { fontSize: '11px', colors: ['#fff'], fontWeight: 700 },
                    offsetX: -4,
                  },
                  tooltip: {
                    y: { formatter: v => `${fmt(v)} (${racaTotal > 0 ? (v/racaTotal*100).toFixed(2) : 0}%)` },
                  },
                  fill: { opacity: 0.9 },
                }}
                series={[{ name: 'Gestantes', data: raca.map(r => Number(r.total)) }]}
              />
            )}
          </div>

          {/* Detalhe doses */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle>Detalhe &ndash; Doses dispensadas (PEP)</SectionTitle>
            <div className="space-y-3 mt-1">
              {[
                { label: 'Adequado',      n: nAdequado,     color: COLORS.emerald },
                { label: 'Inadequado',    n: nInadequado,   color: COLORS.coral },
                { label: 'Em tratamento', n: nEmTratamento, color: COLORS.amber },
              ].map(s => (
                <GaugeRow
                  key={s.label}
                  label={s.label}
                  pct={totalStatus > 0 ? s.n / totalStatus * 100 : 0}
                  count={s.n}
                  color={s.color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BANNER LISTAGEM */}
      <button
        onClick={onListagem}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center gap-5 cursor-pointer hover:from-teal-700 hover:to-teal-600 transition-all duration-300 shadow-lg w-full text-left"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          &#128203;
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-widest uppercase">Listagem Nominal &ndash; Gestantes com S&iacute;filis</p>
          <p className="text-slate-400 text-xs mt-0.5 group-hover:text-teal-200">Todas as gestantes com registro de s&iacute;filis no PEP</p>
        </div>
        <div className="ml-auto text-slate-400 text-xl group-hover:text-white transition-colors">&#8594;</div>
      </button>

      <Footer extra="Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria)" />
    </div>
  )
}
