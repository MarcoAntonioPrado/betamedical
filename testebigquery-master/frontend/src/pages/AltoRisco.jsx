import Chart from 'react-apexcharts'
import { useQuery } from '../hooks/useQuery'
import { api } from '../api'
import Spinner, { ErrorMessage } from '../components/Spinner'

const base = {
  toolbar: { show: false },
  fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
  animations: { enabled: true, speed: 600 },
}

function fmt(n) {
  if (n == null || isNaN(Number(n))) return '-'
  return Number(n).toLocaleString('pt-BR')
}

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="inline-block w-3 h-0.5 bg-violet-400 rounded-full" />
      {children}
    </p>
  )
}

function HeroCard({ label, value, sub, bg, text, border }) {
  return (
    <div className={`rounded-2xl p-5 border ${bg} ${border}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest ${text} opacity-70`}>{label}</p>
      <p className={`text-4xl font-black leading-none mt-1 ${text}`}>{value}</p>
      {sub && <p className={`text-xs mt-1.5 ${text} opacity-60`}>{sub}</p>}
    </div>
  )
}

export default function AltoRisco({ onListagem }) {
  const { data, loading, error } = useQuery({ kpis: api.altoRiscoKpis })
  const kpis = data?.kpis

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>
  if (error)   return <ErrorMessage message={error} />

  const cats    = kpis?.categorias ?? []
  const apRows  = kpis?.por_ap ?? []
  const apLabels = apRows.map(r => 'AP ' + r.ap)
  const apData   = apRows.map(r => Number(r.n))

  return (
    <div className="space-y-5 pb-6">
      {/* HERO */}
      <div className="grid grid-cols-4 gap-4">
        <HeroCard
          label="Total Alto Risco"
          value={fmt(kpis?.total)}
          sub="gestantes ativas"
          bg="bg-gradient-to-br from-violet-600 to-violet-700"
          text="text-white" border="border-violet-500"
        />
        <HeroCard
          label="Encaminhadas"
          value={fmt(kpis?.encaminhada_sim)}
          sub={`${kpis?.pct_enc ?? '-'}% do total`}
          bg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          text="text-white" border="border-emerald-400"
        />
        <HeroCard
          label="N&atilde;o Encaminhadas"
          value={fmt(kpis?.encaminhada_nao)}
          sub="sem registro de encaminhamento"
          bg="bg-white" text="text-slate-700" border="border-slate-200"
        />
        <HeroCard
          label="Pendentes Urgentes"
          value={fmt(kpis?.pendente)}
          sub="deve Sim, ainda n&atilde;o encaminhada"
          bg="bg-gradient-to-br from-rose-500 to-rose-600"
          text="text-white" border="border-rose-400"
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-12 gap-4">

        {/* Encaminhamento donut */}
        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <SectionTitle>Encaminhamento</SectionTitle>
          <Chart
            type="donut"
            height={220}
            options={{
              chart: { ...base, type: 'donut' },
              labels: ['Encaminhada', 'N\u00e3o Encaminhada'],
              colors: ['#10b981', '#e2e8f0'],
              dataLabels: { enabled: true, formatter: (v) => v.toFixed(1) + '%', style: { fontSize: '12px', fontWeight: 700, colors: ['#fff', '#94a3b8'] } },
              legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#475569' } },
              plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '12px', color: '#475569', formatter: () => fmt(kpis?.total) } } } } },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
              stroke: { width: 0 },
            }}
            series={[Number(kpis?.encaminhada_sim ?? 0), Number(kpis?.encaminhada_nao ?? 0)]}
          />
          <div className="mt-3 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Deve Encaminhar (Sim)</p>
              <p className="text-xl font-black text-indigo-700">{fmt(kpis?.deve_sim)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-rose-400 uppercase font-bold">Pendentes</p>
              <p className="text-xl font-black text-rose-600">{fmt(kpis?.pendente)}</p>
            </div>
          </div>
        </div>

        {/* Top categorias */}
        <div className="col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <SectionTitle>Top 10 Categorias de Risco</SectionTitle>
          <Chart
            type="bar"
            height={240}
            options={{
              chart: { ...base, type: 'bar' },
              colors: ['#7c3aed'],
              plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 3 } },
              xaxis: {
                categories: cats.map(c => c.categoria_risco),
                labels: { style: { fontSize: '10px', colors: '#475569' } },
              },
              yaxis: { labels: { style: { fontSize: '10px', colors: '#475569', fontWeight: 600 } } },
              grid: { borderColor: '#f1f5f9' },
              dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '10px', colors: ['#fff'], fontWeight: 700 } },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
            }}
            series={[{ name: 'Gestantes', data: cats.map(c => Number(c.n)) }]}
          />
        </div>

        {/* Por AP */}
        <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <SectionTitle>Por &Aacute;rea Program&aacute;tica</SectionTitle>
          <Chart
            type="bar"
            height={240}
            options={{
              chart: { ...base, type: 'bar' },
              colors: ['#6366f1'],
              plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 3 } },
              xaxis: {
                categories: apLabels,
                labels: { style: { fontSize: '10px', colors: '#475569', fontWeight: 600 } },
                axisBorder: { show: false }, axisTicks: { show: false },
              },
              yaxis: { labels: { style: { fontSize: '10px', colors: '#475569' } } },
              grid: { borderColor: '#f1f5f9' },
              dataLabels: { enabled: false },
              tooltip: { y: { formatter: v => fmt(v) + ' gestantes' } },
            }}
            series={[{ name: 'Gestantes', data: apData }]}
          />
        </div>
      </div>

      {/* BANNER */}
      <button
        onClick={onListagem}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-5 flex items-center gap-5 cursor-pointer hover:from-violet-700 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-slate-200 w-full text-left"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          &#128203;
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-widest uppercase">Listagem Nominal &ndash; Gestantes Alto Risco</p>
          <p className="text-slate-400 text-xs mt-0.5 group-hover:text-violet-200">Todas as gestantes classificadas como alto risco no PEP</p>
        </div>
        <div className="ml-auto text-slate-400 text-xl group-hover:text-white transition-colors">&#8594;</div>
      </button>

      {/* RODAPE */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-100">
        <p>Fonte: PEP (atualiza&ccedil;&atilde;o di&aacute;ria) &middot; N&uacute;cleo de Intelig&ecirc;ncia Assistencial (NIA) &middot; nucleoia.sap@gmail.com</p>
        <p>Vers&atilde;o 1</p>
      </div>
    </div>
  )
}
