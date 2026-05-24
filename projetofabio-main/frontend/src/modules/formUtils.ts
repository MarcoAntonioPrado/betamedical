import type { EntityConfig, FieldDefinition } from '@atlasmed/shared'

export function buildInitialForm(config: EntityConfig, record?: Record<string, unknown>) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    const currentValue = record?.[field.key]
    if (currentValue !== undefined) {
      acc[field.key] = currentValue
      return acc
    }

    if (field.type === 'checkbox') acc[field.key] = false
    else if (field.type === 'number' || field.type === 'currency') acc[field.key] = 0
    else if (field.type === 'select') acc[field.key] = field.options?.[0]?.value ?? ''
    else acc[field.key] = ''
    return acc
  }, {})
}

export function coerceFieldValue(field: FieldDefinition, value: unknown) {
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'number' || field.type === 'currency') return Number(value ?? 0)
  return value ?? ''
}

export function serializeForm(config: EntityConfig, form: Record<string, unknown>) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.key] = coerceFieldValue(field, form[field.key])
    return acc
  }, {})
}

export function isFullWidthField(field: FieldDefinition) {
  return field.type === 'textarea'
}

export function readInputValue(value: unknown) {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : ''
  return String(value ?? '')
}