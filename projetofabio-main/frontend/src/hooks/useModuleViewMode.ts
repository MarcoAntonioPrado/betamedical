import { useEffect, useState } from 'react'

export type ViewMode = 'list' | 'grid'

export function useModuleViewMode(key: string, initialMode: ViewMode = 'list') {
  const storageKey = `atlasmed:view:${key}`
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initialMode
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'list' || stored === 'grid' ? stored : initialMode
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, viewMode)
  }, [storageKey, viewMode])

  return { viewMode, setViewMode }
}