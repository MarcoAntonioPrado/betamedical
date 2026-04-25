import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cyan'

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

const variants: Record<Variant, string> = {
  default: 'bg-hud-alt text-slate-500 border-hud-border',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/10 text-red-400 border-red-500/20',
  info:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
  cyan:    'bg-sky-500/15 text-sky-300 border-sky-400/30',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
