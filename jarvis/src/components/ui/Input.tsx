import { clsx } from 'clsx'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.1em]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 bg-hud-alt border border-hud-border rounded-md',
          'text-sm text-slate-200 placeholder-slate-600',
          'focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/50',
          'transition-colors duration-150',
          error && 'border-red-500/50 focus:ring-red-500/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.1em]"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-3 py-2 bg-hud-alt border border-hud-border rounded-md',
          'text-sm text-slate-200 placeholder-slate-600',
          'focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/50',
          'transition-colors duration-150 resize-none',
          error && 'border-red-500/50 focus:ring-red-500/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
