// Shared ApexCharts configuration and formatting utilities

export const chartBase = {
  toolbar: { show: false },
  fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
  animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 80 } },
}

export const gridStyle = {
  borderColor: '#e2e8f0',
  strokeDashArray: 4,
}

// Institutional color palette
export const COLORS = {
  primary:  '#1e3a5f',   // navy
  health:   '#0d9488',   // teal
  accent:   '#2b5ea6',   // blue
  coral:    '#e11d48',    // alerts/sífilis
  blue:     '#1d4ed8',    // hipertensão
  amber:    '#d97706',    // warnings
  emerald:  '#059669',    // success
  slate:    '#475569',    // neutral
}

// Chart-ready palettes
export const PALETTE_MAIN     = ['#1e3a5f','#0d9488','#2b5ea6','#d97706','#059669','#7c3aed']
export const PALETTE_MULTI    = ['#1d4ed8','#0d9488','#d97706','#e11d48','#7c3aed','#059669','#475569']
export const PALETTE_DONUT    = ['#1e3a5f','#2b5ea6','#0d9488']
export const PALETTE_RACA     = {
  amarela:  '#d97706',
  branca:   '#2b5ea6',
  indigena: '#7c3aed',
  nao:      '#94a3b8',
  parda:    '#0d9488',
  preta:    '#1e293b',
}
export const PALETTE_RACA_FALLBACK = ['#d97706','#2b5ea6','#7c3aed','#94a3b8','#0d9488','#1e293b','#e11d48','#059669']

/**
 * Format a number in pt-BR locale
 */
export function fmt(n, dec = 0) {
  if (n == null || isNaN(Number(n))) return '-'
  return Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
}
