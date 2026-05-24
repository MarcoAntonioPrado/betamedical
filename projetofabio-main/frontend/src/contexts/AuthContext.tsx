import { APP_MODULES, demoAccounts, type AppMode, type RoleAccessConfig, type SessionUser } from '@atlasmed/shared'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { api, setApiToken } from '../lib/api'
import { firebaseLogin, firebaseLogout, isFirebaseConfigured } from '../lib/firebase'

interface BootstrapState {
  modules: typeof APP_MODULES
  companyProfile: Record<string, unknown>
  demoHints: Array<{ email: string; password: string; role: string; name: string }>
}

interface AuthContextValue {
  mode: AppMode
  loading: boolean
  ready: boolean
  user: SessionUser | null
  permissions: RoleAccessConfig
  bootstrap: BootstrapState
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshBootstrap: () => Promise<void>
}

const DEMO_HINTS = demoAccounts.map(({ email, password, user }) => ({
  email,
  password,
  role: user.role,
  name: user.name,
}))

const STORAGE_KEY = 'atlasmed-session'

const emptyPermissions: RoleAccessConfig = {
  admin: [],
  gerente: [],
  tecnico: [],
  operador: [],
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function resolveMode(): AppMode {
  const forcedMode = import.meta.env.VITE_APP_MODE as AppMode | undefined
  if (forcedMode === 'firebase' && isFirebaseConfigured()) return 'firebase'
  return 'demo'
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [mode] = useState<AppMode>(() => resolveMode())
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [permissions, setPermissions] = useState<RoleAccessConfig>(emptyPermissions)
  const [bootstrap, setBootstrap] = useState<BootstrapState>({
    modules: APP_MODULES,
    companyProfile: {
      nomeEmpresa: 'AtlasMed Beta',
      tagline: 'Gestão moderna para equipamentos médicos.',
    },
    demoHints: DEMO_HINTS,
  })

  async function loadBootstrap() {
    const payload = await api.bootstrap()
    setUser(payload.user)
    setPermissions(payload.permissions)
    setBootstrap({
      modules: APP_MODULES,
      companyProfile: payload.companyProfile,
      demoHints: payload.demoHints.length > 0 ? payload.demoHints : DEMO_HINTS,
    })
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setLoading(false)
      setReady(true)
      return
    }

    const parsed = JSON.parse(saved) as { token?: string; mode?: AppMode }
    if (!parsed.token || parsed.mode !== mode) {
      window.localStorage.removeItem(STORAGE_KEY)
      setLoading(false)
      setReady(true)
      return
    }

    setApiToken(parsed.token)
    setToken(parsed.token)
    loadBootstrap()
      .catch(() => {
        setApiToken(null)
        setToken(null)
        setUser(null)
        window.localStorage.removeItem(STORAGE_KEY)
      })
      .finally(() => {
        setLoading(false)
        setReady(true)
      })
  }, [mode])

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const nextToken = mode === 'demo' ? (await api.loginDemo({ email, password })).token : await firebaseLogin(email, password)
      setApiToken(nextToken)
      setToken(nextToken)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, mode }))
      await loadBootstrap()
    } finally {
      setLoading(false)
      setReady(true)
    }
  }

  async function logout() {
    if (mode === 'firebase') {
      await firebaseLogout()
    }
    setApiToken(null)
    setToken(null)
    setUser(null)
    setPermissions(emptyPermissions)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo<AuthContextValue>(() => ({
    mode,
    loading,
    ready,
    user,
    permissions,
    bootstrap,
    token,
    login,
    logout,
    refreshBootstrap: loadBootstrap,
  }), [bootstrap, loading, mode, permissions, ready, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return context
}