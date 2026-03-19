export default function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-60 gap-3">
      <div className="w-10 h-10 border-4 border-health-100 border-t-health-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Carregando dados…</p>
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      <span className="text-lg leading-none shrink-0">&#9888;</span>
      <div>
        <p className="font-semibold">Erro ao carregar dados</p>
        <p className="text-red-600 mt-0.5">{message}</p>
      </div>
    </div>
  )
}
