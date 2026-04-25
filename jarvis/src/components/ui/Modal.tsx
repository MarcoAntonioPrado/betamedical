import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal>
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={clsx(
          'relative bg-hud-surface border border-hud-border rounded-lg shadow-2xl animate-fade-in',
          'w-full max-w-md mx-4',
          className,
        )}
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.7), 0 0 1px rgba(14,165,233,0.15)' }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-sky-500/25 rounded-full" />

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hud-border">
          <div className="flex items-center gap-2.5">
            <span className="w-0.5 h-4 bg-sky-500/70 rounded-full" />
            <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
