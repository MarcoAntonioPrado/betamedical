import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={compact ? 'segmented-switch theme-switch compact' : 'segmented-switch theme-switch'} role="tablist" aria-label="Tema">
      <button
        type="button"
        className={theme === 'light' ? 'switch-option active' : 'switch-option'}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
      >
        Claro
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'switch-option active' : 'switch-option'}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
      >
        Escuro
      </button>
    </div>
  )
}