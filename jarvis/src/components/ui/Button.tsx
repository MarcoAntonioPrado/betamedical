import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border-sky-500/40 hover:border-sky-400/60',
  secondary: 'bg-hud-alt hover:bg-white/5 text-slate-300 border-hud-border hover:border-slate-600',
  ghost:     'bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 border-transparent',
  danger:    'bg-red-500/10 hover:bg-red-500/15 text-red-400 border-red-500/30 hover:border-red-500/50',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-md border',
        'transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
