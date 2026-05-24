import type { ViewMode } from '../hooks/useModuleViewMode'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="segmented-switch view-switch" role="tablist" aria-label="Modo de visualização">
      <button
        type="button"
        className={value === 'list' ? 'switch-option active' : 'switch-option'}
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        Lista
      </button>
      <button
        type="button"
        className={value === 'grid' ? 'switch-option active' : 'switch-option'}
        aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')}
      >
        Grade
      </button>
    </div>
  )
}