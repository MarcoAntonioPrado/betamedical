interface StatusPillProps {
  label: string
}

export function StatusPill({ label }: StatusPillProps) {
  const tone = label.toLowerCase()
  const className = tone.includes('ativo') || tone.includes('aprov') || tone.includes('operação') || tone.includes('conclu')
    ? 'status-pill success'
    : tone.includes('aguardando') || tone.includes('pendente') || tone.includes('teste')
      ? 'status-pill warning'
      : tone.includes('reje') || tone.includes('vencido') || tone.includes('inativo')
        ? 'status-pill danger'
        : 'status-pill info'

  return <span className={className}>{label}</span>
}