import { useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'
import SectionTitle from '../components/SectionTitle'
import Footer from '../components/Footer'
import { chartBase, gridStyle, fmt, PALETTE_RACA, PALETTE_RACA_FALLBACK, PALETTE_DONUT, COLORS } from '../lib/chartDefaults'

const TRIM_COLORS = [COLORS.primary, COLORS.accent, COLORS.health]
const FAIXAS_ORDER = ['10-14 anos','15-20 anos','21-30 anos','31-40 anos','>40 anos']

function sortFaixas(arr) {
  return [...arr].sort((a, b) => {
    const ia = FAIXAS_ORDER.indexOf(a), ib = FAIXAS_ORDER.indexOf(b)
    if (ia >= 0 && ib >= 0) return ia - ib
    return a.localeCompare(b)
  })
}

function BarPct({ label, pct, color = '#475569' }) {
  const v = pct != null && !isNaN(Number(pct)) ? Math.min(Number(pct), 100) : null
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">{label}</p>
          {v !== null && (
            <span className="text-xs font-bold" style={{ color }}>{fmt(pct, 2)}%</span>
          )}
        </div>
      )}
      <div className="relative bg-slate-100 rounded-full h-2.5 overflow-hidden">
        {v !== null ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
            style={{ width: `${v}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          />
        ) : (
          <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-slate-200 animate-pulse" />
        )}
      </div>
    </div>
  )
}

export default function Overview({ onListagem }) {
  const { data, loading, error } = useQuery({
    overviewKpis:    api.overviewKpis,
    racaFaixaEtaria: api.racaFaixaEtaria,
    trimestres:      api.trimestres,
    areaProgratica:  api.areaProgratica,
  })

  const [prescricoes, setPrescricoes] = useState(null)
  const [saudeBucal,  setSaudeBucal]  = useState(null)
  const [vacinaVsr,   setVacinaVsr]   = useState(null)

  useEffect(() => {
    api.prescricoes().then(setPrescricoes).catch(() => {})
    api.saudeBucal().then(setSaudeBucal).catch(() => {})
    api.vacinaVsr().then(setVacinaVsr).catch(() => {})
  }, [])

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { overviewKpis: kpi, racaFaixaEtaria, trimestres, areaProgratica } = data

  const faixas = sortFaixas([...new Set(racaFaixaEtaria.map(r => r.faixa_etaria))])
  const racas  = [...new Set(racaFaixaEtaria.map(r => r.raca))].sort()
  const racaSeries = racas.map(raca => ({
    name: raca,
    data: faixas.map(faixa => {
      const m = racaFaixaEtaria.find(r => r.faixa_etaria === faixa && r.raca === raca)
      return m ? Number(m.total) : 0
    }),
  }))
  const racaColors = racas.map((r, i) =>
    PALETTE_RACA[r.toLowerCase()] ?? PALETTE_RACA_FALLBACK[i % PALETTE_RACA_FALLBACK.length]
  )

  const apSorted = [...areaProgratica].sort(
    (a, b) => Number(a.area_programatica) - Number(b.area_programatica)
  )

  const trimOrder  = ['1\u00ba trimestre','2\u00ba trimestre','3\u00ba trimestre']
  const trimSorted = [...trimestres].sort(
    (a, b) => trimOrder.indexOf(a.trimestre) - trimOrder.indexOf(b.trimestre)
  )
  const totalTrim = trimSorted.reduce((s, r) => s + Number(r.total), 0)

  return (
    <div className="space-y-5 pb-4">

      {/* HERO KPI */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #0f172a, #12305a, #183d72)' }}>
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1">Gestantes em acompanhamento</p>
            <p className="text-6xl font-black text-white leading-none tracking-tight">{fmt(kpi.em_acompanhamento)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[110px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">Adolescentes<br/>(&lt; 18 anos)</p>
              <p className="text-2xl font-extrabold text-white">{fmt(kpi.adolescentes)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[110px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">Adultas<br/>(&ge; 35 anos)</p>
              <p className="text-2xl font-extrabold text-white">{fmt(kpi.adultas_35_mais)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA PRINCIPAL: 3 colunas */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* COLUNA ESQUERDA */}
        <div className="col-span-3 space-y-4">

          {/* Prescricoes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-health-500">Prescri&ccedil;&otilde;es</SectionTitle>
            <div className="space-y-4">
              <BarPct label="&Aacute;cido F&oacute;lico" pct={prescricoes?.pct_acido_folico} color={COLORS.health} />
              <BarPct label="Carbonato de C&aacute;lcio" pct={prescricoes?.pct_carbonato_calcio} color={COLORS.accent} />
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              *Prescri&ccedil;&atilde;o realizada ao menos 1 vez durante a gesta&ccedil;&atilde;o.
            </p>
          </div>

          {/* Agravos */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-amber-500">Principais agravos (%)</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 text-center border border-red-100">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-tight mb-2">Diabetes</p>
                <p className="text-3xl font-black text-red-700 leading-none">{fmt(kpi.pct_diabetes, 1)}<span className="text-base font-bold">%</span></p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-tight mb-2">Hipertens&atilde;o</p>
                <p className="text-3xl font-black text-amber-700 leading-none">{fmt(kpi.pct_hipertensao, 1)}<span className="text-base font-bold">%</span></p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              *Principais CIDs ativos no PEP durante a gesta&ccedil;&atilde;o.
            </p>
          </div>

          {/* Saude Bucal + VSR */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div>
              <SectionTitle color="bg-gov-400">Sa&uacute;de Bucal &amp; Vacina</SectionTitle>
              <BarPct label="Consulta de Sa&uacute;de Bucal" pct={saudeBucal?.pct_consulta_bucal} color={COLORS.accent} />
            </div>
            <BarPct label="Vacina VSR (Sincicial)" pct={vacinaVsr?.pct_vacina_vsr} color="#7c3aed" />
          </div>
        </div>

        {/* COLUNA CENTRAL */}
        <div className="col-span-6 space-y-4">

          {/* Raca x Faixa etaria */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle>Ra&ccedil;a e faixa et&aacute;ria</SectionTitle>
            {racaSeries.length > 0 && faixas.length > 0 ? (
              <Chart
                type="bar"
                height={285}
                options={{
                  chart: { ...chartBase, type: 'bar', stacked: true },
                  colors: racaColors,
                  plotOptions: {
                    bar: {
                      horizontal: true,
                      barHeight: '62%',
                      borderRadius: 4,
                      borderRadiusWhenStacked: 'last',
                      dataLabels: { total: { enabled: true, style: { fontSize: '11px', fontWeight: 700, color: '#475569' } } },
                    },
                  },
                  xaxis: {
                    categories: faixas,
                    labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: {
                    labels: { style: { fontSize: '12px', colors: '#334155', fontWeight: 600 } },
                  },
                  legend: {
                    position: 'bottom',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    offsetY: 4,
                    markers: { width: 8, height: 8, radius: 4 },
                    itemMargin: { horizontal: 8 },
                  },
                  tooltip: { shared: false, y: { formatter: v => fmt(v) + ' gestantes' } },
                  grid: { ...gridStyle, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
                  dataLabels: { enabled: false },
                  fill: { opacity: 1 },
                }}
                series={racaSeries}
              />
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center">Sem dados</p>
            )}
          </div>

          {/* AP */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle>Gestantes por &Aacute;rea Program&aacute;tica</SectionTitle>
            <Chart
              type="bar"
              height={210}
              options={{
                chart: { ...chartBase, type: 'bar' },
                colors: [COLORS.accent],
                plotOptions: { bar: { borderRadius: 6, columnWidth: '58%' } },
                fill: {
                  type: 'gradient',
                  gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.4, gradientToColors: [COLORS.health], opacityFrom: 1, opacityTo: 0.85 },
                },
                xaxis: {
                  categories: apSorted.map(r => r.area_programatica),
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
                  style: { fontSize: '10px', colors: [COLORS.primary], fontWeight: 700 },
                },
                tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
              }}
              series={[{ name: 'Gestantes', data: apSorted.map(r => Number(r.total)) }]}
            />
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-3 space-y-4">

          {/* Periodo gestacao */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle>Per&iacute;odo da gesta&ccedil;&atilde;o</SectionTitle>
            {trimSorted.length > 0 ? (
              <>
                <Chart
                  type="donut"
                  height={210}
                  options={{
                    chart: { ...chartBase, type: 'donut' },
                    colors: TRIM_COLORS,
                    labels: trimSorted.map(r => r.trimestre),
                    legend: { show: false },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '68%',
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
                            value: { fontSize: '22px', fontWeight: 800, color: '#1e293b' },
                          },
                        },
                      },
                    },
                    dataLabels: { enabled: false },
                    tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
                    stroke: { width: 2, colors: ['#fff'] },
                  }}
                  series={trimSorted.map(r => Number(r.total))}
                />
                <div className="mt-3 space-y-2">
                  {trimSorted.map((r, i) => {
                    const pct = totalTrim > 0 ? (Number(r.total) / totalTrim * 100).toFixed(1) : '0.0'
                    return (
                      <div key={r.trimestre} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TRIM_COLORS[i] }} />
                          <span className="text-xs text-slate-600 font-medium">{r.trimestre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{fmt(r.total)}</span>
                          <span className="text-[10px] text-slate-400 font-semibold w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center">Sem dados</p>
            )}
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
          <span className="text-xl">&#128203;</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-widest uppercase">Listagem Nominal</p>
          <p className="text-slate-400 text-xs mt-0.5 group-hover:text-teal-200">Todas as gestantes em acompanhamento</p>
        </div>
        <div className="ml-auto text-slate-400 text-xl group-hover:text-white transition-colors">&#8594;</div>
      </button>

      <Footer />
    </div>
  )
}
