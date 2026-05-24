import type { CalibrationStatus, ResourceBase } from './types.js'

export function extractNumericSuffix(id: string, prefix: string): number {
  const match = String(id || '').match(new RegExp(`${prefix}[-_ ]?(\\d+)`, 'i')) || String(id || '').match(/(\d+)(?!.*\d)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

export function generatePrefixedId<T extends ResourceBase>(records: T[], prefix: string): string {
  const highest = records.reduce((max, record) => Math.max(max, extractNumericSuffix(record.id, prefix)), 0)
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`
}

export function formatCurrency(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function calculateCalibrationStatus(validadeCalibracao: string): CalibrationStatus {
  const target = new Date(validadeCalibracao)
  const now = new Date()
  if (Number.isNaN(target.getTime())) return 'Válido'
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Vencido'
  if (diffDays <= 30) return 'Vencendo'
  return 'Válido'
}

export function sumCurrency(items: Array<number | undefined | null>): number {
  return items.reduce<number>((total, item) => total + Number(item ?? 0), 0)
}