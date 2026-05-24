import type { PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
}

export function Modal({ open, title, subtitle, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Área de edição</p>
            <h3>{title}</h3>
            {subtitle ? <p className="muted-text">{subtitle}</p> : null}
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}