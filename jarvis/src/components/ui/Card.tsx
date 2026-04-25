import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Adds a top cyan accent border stripe */
  accent?: boolean
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className, accent, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-hud-surface border border-hud-border rounded-lg p-4 animate-fade-in',
        'hover:border-slate-600/60 transition-colors duration-150',
        className,
      )}
      style={accent ? { borderTopColor: 'rgba(14,165,233,0.5)', borderTopWidth: '1px' } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: PanelProps) {
  return (
    <div className={clsx('mb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: PanelProps) {
  return (
    <h3
      className={clsx(
        'text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  )
}
