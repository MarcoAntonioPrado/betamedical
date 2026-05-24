import { useUi } from '../contexts/UiContext'

export function ToastHost() {
  const { notices, dismissNotice } = useUi()

  return (
    <div className="toast-host">
      {notices.map((notice) => (
        <button key={notice.id} type="button" className={`toast-card ${notice.tone}`} onClick={() => dismissNotice(notice.id)}>
          <strong>{notice.title}</strong>
          <span>{notice.message}</span>
        </button>
      ))}
    </div>
  )
}