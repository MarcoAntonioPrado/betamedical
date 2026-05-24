import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

export type NoticeTone = 'success' | 'error' | 'info'

export interface Notice {
  id: number
  title: string
  message: string
  tone: NoticeTone
}

interface UiContextValue {
  notices: Notice[]
  showNotice: (notice: Omit<Notice, 'id'>) => void
  dismissNotice: (id: number) => void
}

const UiContext = createContext<UiContextValue | undefined>(undefined)

export function UiProvider({ children }: PropsWithChildren) {
  const [notices, setNotices] = useState<Notice[]>([])

  const value = useMemo<UiContextValue>(() => ({
    notices,
    showNotice(notice) {
      const id = Date.now() + Math.round(Math.random() * 1000)
      setNotices((current) => [...current, { ...notice, id }])
      window.setTimeout(() => {
        setNotices((current) => current.filter((item) => item.id !== id))
      }, 4200)
    },
    dismissNotice(id) {
      setNotices((current) => current.filter((item) => item.id !== id))
    },
  }), [notices])

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const context = useContext(UiContext)
  if (!context) {
    throw new Error('useUi deve ser usado dentro de UiProvider.')
  }
  return context
}