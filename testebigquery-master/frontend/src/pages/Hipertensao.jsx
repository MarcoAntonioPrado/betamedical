import Chart from 'react-apexcharts'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'
import SectionTitle from '../components/SectionTitle'
import Footer from '../components/Footer'
import { chartBase, fmt, COLORS } from '../lib/chartDefaults'

function AlertCard({ label, value, icon, bg, border, text }) {
  return (
    <div className={`rounded-xl p-3.5 border flex items-center gap-3 ${bg} ${border}`}>
      <div className={`text-xl shrink-0 ${text}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight truncate">{label}</p>
        <p className={`text-2xl font-black leading-none ${text}`}>{value}</p>
      </div>
    </div>
  )
}

function GaugeSemi({ pct, color, label, count }) {
  const v = Math.min(Number(pct) || 0, 100)
  return (
    <div className="flex-1 flex flex-col items-center">
      <Chart
        type="radialBar"
        height={130}
        options={{
          chart: { ...chartBase, type: 'radialBar' },
          colors: [color],
          plotOptions: {
            radialBar: {
              startAngle: -135,
              endAngle: 135,
              hollow: { margin: 0, size: '62%' },
              track: { background: '#e2e8f0', strokeWidth: '100%', margin: 0 },
              dataLabels: {
                name: { show: false },
                value: {
                  offsetY: 6,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#1e293b',
                  formatter: v => v + '%',
                },
              },
            },
          },
          stroke: { lineCap: 'round' },
          legend: { show: false },
        }}
        series={[v]}
      />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center -mt-3 px-1 leading-tight">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">({fmt(count)})</p>
    </div>
  )
}

export default function Hipertensao({ onListagem }) {
  const { data, loading, error } = useQuery({
    kpis: api.hasKpis,
    ap:   api.hasAp,
  })

  if (loading) return <Spinner />
  if (error)   return <ErrorMessage message={error} />

  const { kpis, ap } = data

  const total     = Number(kpis.total)
  const cidAtivo  = Number(kpis.cid_ativo)
  const provavel  = Number(kpis.provavel_has)
  const paTotal   = Number(kpis.pa_controlada) + Number(kpis.pa_alterada)

  // AP chart series
  const apLabels = ap.map(r => `AP ${r.ap}`)
  const cidSeries  = ap.map(r => {
    const tot = Number(r.cid_ativo) + Number(r.provavel_has)
    return tot > 0 ? +((Number(r.cid_ativo) / tot) * 100).toFixed(1) : 0
  })
  const provSeries = ap.map(r => {
    const tot = Number(r.cid_ativo) + Number(r.provavel_has)
    return tot > 0 ? +((Number(r.provavel_has) / tot) * 100).toFixed(1) : 0
  })

  return (
    <div className="space-y-5 pb-4">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #0f172a, #12305a, #183d72)' }}>
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1">Total de casos HAS</p>
            <p className="text-6xl font-black text-white leading-none tracking-tight">{fmt(total)}</p>
            <p className="text-slate-300 text-xs mt-1.5">(CID ativo + casos prov&aacute;veis)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[130px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">CID Ativo HAS</p>
              <p className="text-3xl font-extrabold text-white">{fmt(cidAtivo)}</p>
              <div className="mt-2 bg-teal-400 rounded-full h-1 w-full" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center min-w-[130px] border border-white/10">
              <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide leading-tight mb-1">Prov&aacute;vel HAS</p>
              <p className="text-3xl font-extrabold text-white">{fmt(provavel)}</p>
              <div className="mt-2 bg-slate-400 rounded-full h-1 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* LINHA PRINCIPAL */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* COLUNA ESQUERDA - CID ativo operacional */}
        <div className="col-span-3 space-y-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-gov-500">M&eacute;tricas &ndash; CID Ativo HAS</SectionTitle>
            <div className="space-y-3">
              {[
                { label: 'Com encaminhamento ao alto risco', value: fmt(kpis.com_encaminhamento), bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '&#9888;' },
                { label: 'Com dispensa de aparelho de PA',   value: fmt(kpis.com_aparelho_pa),    bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  icon: '&#128208;' },
                { label: 'Com +30 dias sem atendimento',     value: fmt(kpis.sem_atd_30_dias),    bg: 'bg-rose-50',  border: 'border-rose-200',  text: 'text-rose-700',  icon: '&#128337;' },
              ].map(c => (
                <AlertCard key={c.label} {...c} />
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL */}
        <div className="col-span-5 space-y-4">

          {/* PA controlada X Alterada */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-gov-500">Hipertensas &ndash; &uacute;ltima PA controlada X PA alterada (%)</SectionTitle>
            <div className="flex items-center gap-4">
              {paTotal > 0 && (
                <div className="flex-1">
                  <Chart
                    type="donut"
                    height={190}
                    options={{
                      chart: { ...chartBase, type: 'donut' },
                      colors: [COLORS.primary, '#e2e8f0'],
                      labels: ['PA Alterada', 'PA Controlada'],
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
                                formatter: () => fmt(paTotal),
                              },
                              value: { fontSize: '20px', fontWeight: 800, color: '#1e293b' },
                            },
                          },
                        },
                      },
                      dataLabels: { enabled: false },
                      stroke: { width: 2, colors: ['#fff'] },
                      tooltip: { y: { formatter: v => fmt(v) } },
                    }}
                    series={[Number(kpis.pa_alterada), Number(kpis.pa_controlada)]}
                  />
                </div>
              )}
              <div className="space-y-3 min-w-[140px]">
                {[
                  { label: 'PA Alterada',   pct: kpis.pct_pa_alterada,   n: kpis.pa_alterada,   color: COLORS.primary },
                  { label: 'PA Controlada', pct: kpis.pct_pa_controlada, n: kpis.pa_controlada, color: '#e2e8f0', textColor: '#94a3b8' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-slate-600">{r.label}</span>
                    <span className="ml-auto text-xs font-bold text-slate-700">{r.pct}%</span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 italic leading-tight">*PA controlada: &lt;140/90</p>
              </div>
            </div>
          </div>

          {/* Prescricoes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-health-500">Prescri&ccedil;&otilde;es (%)*</SectionTitle>
            <div className="flex gap-2">
              <GaugeSemi pct={kpis.pct_carbonato} color={COLORS.health} label="Carbonato de C&aacute;lcio" count={kpis.carbonato_calcio} />
              <GaugeSemi pct={kpis.pct_aas}       color={COLORS.primary} label="AAS" count={kpis.aas} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center italic">*Prescri&ccedil;&atilde;o realizada ao menos 1 vez</p>
          </div>

          {/* AP chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-gov-500">CID ativo X Prov&aacute;vel HAS, por AP (%)</SectionTitle>
            <Chart
              type="bar"
              height={240}
              options={{
                chart: { ...chartBase, type: 'bar', stacked: true, stackType: '100%' },
                colors: [COLORS.primary, '#94a3b8'],
                plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 3 } },
                xaxis: {
                  categories: apLabels,
                  labels: { show: false },
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                },
                yaxis: {
                  labels: { style: { fontSize: '11px', colors: '#475569', fontWeight: 600 } },
                },
                grid: { show: false },
                dataLabels: {
                  enabled: true,
                  formatter: v => v > 5 ? v.toFixed(1) + '%' : '',
                  style: { fontSize: '10px', colors: ['#fff'], fontWeight: 700 },
                },
                legend: {
                  show: true,
                  position: 'bottom',
                  fontSize: '11px',
                  labels: { colors: '#475569' },
                  markers: { size: 8, shape: 'square' },
                },
                tooltip: { y: { formatter: v => v.toFixed(1) + '%' } },
              }}
              series={[
                { name: 'CID ativo', data: cidSeries },
                { name: 'Prov&aacute;vel HAS', data: provSeries },
              ]}
            />
          </div>
        </div>

        {/* COLUNA DIREITA - Provavel HAS metricas */}
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <SectionTitle color="bg-gov-500">M&eacute;tricas &ndash; Prov&aacute;vel HAS</SectionTitle>
            <div className="space-y-3">
              {[
                { label: 'Anti-hipertensivo',         value: fmt(kpis.anti_hipertensivo), bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '&#9888;' },
                { label: 'Encaminhada ao AR',          value: fmt(kpis.encaminhada_ar),    bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700', icon: '&#9888;' },
                { label: 'Aparelho PA dispensado',     value: fmt(kpis.aparelho_pa_prov),  bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',  icon: '&#9888;' },
                { label: '\u22652 PA\'s alteradas*',   value: fmt(kpis.duas_pa_alt),        bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',  icon: '&#9888;' },
                { label: '1 PA grave (>160/110)',      value: fmt(kpis.pa_grave),           bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',   icon: '&#9888;' },
              ].map(c => (
                <AlertCard key={c.label} {...c} />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">*PA &ge; 140/90 mmHg</p>
          </div>
        </div>
      </div>

      {/* BANNER */}
      <button
        onClick={onListagem}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center gap-5 cursor-pointer hover:from-teal-700 hover:to-teal-600 transition-all duration-300 shadow-lg w-full text-left"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          &#128203;
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-widest uppercase">Listagem Nominal &ndash; Gestantes com HAS</p>
          <p className="text-slate-400 text-xs mt-0.5 group-hover:text-teal-200">Todas as gestantes com hipertens&atilde;o registrada no PEP</p>
        </div>
        <div className="ml-auto text-slate-400 text-xl group-hover:text-white transition-colors">&#8594;</div>
      </button>

      <Footer extra="Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria)" />
    </div>
  )
}
