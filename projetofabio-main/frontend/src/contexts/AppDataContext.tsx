import type { AppRecordMap, CloseServiceOrderRequest, CollectionName, CreateUserRequest, InventoryMovementRequest } from '@atlasmed/shared'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

type CollectionCache = Partial<{ [Key in CollectionName]: AppRecordMap[Key][] }>

interface AppDataContextValue {
  collections: CollectionCache
  loadingCollections: CollectionName[]
  ensureCollection: <Key extends CollectionName>(collection: Key, force?: boolean) => Promise<AppRecordMap[Key][]>
  ensureCollections: (collections: CollectionName[], force?: boolean) => Promise<void>
  saveRecord: <Key extends CollectionName>(collection: Key, payload: Partial<AppRecordMap[Key]> & { id?: string }) => Promise<AppRecordMap[Key]>
  deleteRecord: <Key extends CollectionName>(collection: Key, id: string) => Promise<void>
  moveInventory: (collection: 'pecas' | 'acessorios', id: string, payload: InventoryMovementRequest) => Promise<void>
  closeServiceOrder: (id: string, payload: CloseServiceOrderRequest) => Promise<void>
  createUser: (payload: CreateUserRequest) => Promise<void>
  resolveLabel: (collection: CollectionName, id: string | undefined, labelKey?: string) => string
  clearCache: () => void
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined)

export function AppDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<CollectionCache>({})
  const [loadingCollections, setLoadingCollections] = useState<CollectionName[]>([])

  // Ref to always hold latest collections without triggering re-creation of callbacks
  const collectionsRef = useRef<CollectionCache>(collections)
  collectionsRef.current = collections

  const setCollectionLoading = useCallback((collection: CollectionName, loading: boolean) => {
    setLoadingCollections((current) => (loading ? [...new Set([...current, collection])] : current.filter((item) => item !== collection)))
  }, [])

  const clearCache = useCallback(() => {
    setCollections({})
  }, [])

  useEffect(() => {
    if (!user) clearCache()
  }, [user, clearCache])

  // Stable reference — reads collections via ref, never needs them in dep array
  const ensureCollection = useCallback(async <Key extends CollectionName>(collection: Key, force = false) => {
    if (!force && collectionsRef.current[collection]) {
      return collectionsRef.current[collection] as AppRecordMap[Key][]
    }
    setCollectionLoading(collection, true)
    try {
      const items = await api.listResource(collection)
      setCollections((current) => ({ ...current, [collection]: items }))
      return items
    } finally {
      setCollectionLoading(collection, false)
    }
  }, [setCollectionLoading])

  const ensureCollections = useCallback(async (requiredCollections: CollectionName[], force = false) => {
    await Promise.all(requiredCollections.map((c) => ensureCollection(c, force)))
  }, [ensureCollection])

  const saveRecord = useCallback(async <Key extends CollectionName>(collection: Key, payload: Partial<AppRecordMap[Key]> & { id?: string }) => {
    let result: AppRecordMap[Key]
    if (payload.id) {
      try {
        result = await api.updateResource(collection, payload.id, payload)
      } catch {
        result = await api.createResource(collection, payload)
      }
    } else {
      result = await api.createResource(collection, payload)
    }
    await ensureCollection(collection, true)
    return result
  }, [ensureCollection])

  const deleteRecord = useCallback(async <Key extends CollectionName>(collection: Key, id: string) => {
    await api.deleteResource(collection, id)
    await ensureCollection(collection, true)
  }, [ensureCollection])

  const moveInventory = useCallback(async (collection: 'pecas' | 'acessorios', id: string, payload: InventoryMovementRequest) => {
    await api.moveInventory(collection, id, payload)
    await ensureCollection(collection, true)
  }, [ensureCollection])

  const closeServiceOrder = useCallback(async (id: string, payload: CloseServiceOrderRequest) => {
    await api.closeServiceOrder(id, payload)
    await ensureCollections(['ordensServico', 'historicoOS', 'equipamentos', 'pecas', 'acessorios'], true)
  }, [ensureCollections])

  const createUser = useCallback(async (payload: CreateUserRequest) => {
    await api.createUser(payload)
    await ensureCollections(['users', 'funcionarios'], true)
  }, [ensureCollections])

  const resolveLabel = useCallback((collection: CollectionName, id: string | undefined, labelKey = 'nome') => {
    if (!id) return 'Sem vínculo'
    const items = collectionsRef.current[collection] ?? []
    const match = items.find((item) => item.id === id) as Record<string, unknown> | undefined
    return String(match?.[labelKey] ?? match?.id ?? id)
  }, [])

  const value = useMemo<AppDataContextValue>(() => ({
    collections,
    loadingCollections,
    ensureCollection,
    ensureCollections,
    saveRecord,
    deleteRecord,
    moveInventory,
    closeServiceOrder,
    createUser,
    resolveLabel,
    clearCache,
  }), [collections, loadingCollections, ensureCollection, ensureCollections, saveRecord, deleteRecord, moveInventory, closeServiceOrder, createUser, resolveLabel, clearCache])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData deve ser usado dentro de AppDataProvider.')
  }
  return context
}