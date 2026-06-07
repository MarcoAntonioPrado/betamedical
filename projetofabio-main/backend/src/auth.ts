import { APP_MODULES, DEFAULT_ROLE_ACCESS, demoAccounts, type CollectionName, type LoginRequest, type ModuleId, type RoleAccessConfig, type SessionPayload, type SessionUser } from '@atlasmed/shared'
import type { NextFunction, Request, Response } from 'express'
import { getFirebaseAdminAuth } from './firebaseAdmin.js'
import { HttpError } from './errors.js'
import { env } from './env.js'
import { dataStore } from './store.js'

export interface AuthenticatedRequest extends Request {
  user?: SessionUser
  permissions?: RoleAccessConfig
}

type DemoCredential = {
  email: string
  password: string
  role: SessionUser['role']
  name: string
  staffId?: string
  userId?: string
}

const moduleByCollection = APP_MODULES.reduce<Partial<Record<CollectionName, ModuleId>>>((acc, module) => {
  if (module.collection) acc[module.collection] = module.id
  return acc
}, {})

function encodeDemoToken(user: SessionUser): string {
  return `demo.${Buffer.from(JSON.stringify(user), 'utf-8').toString('base64url')}`
}

function decodeDemoToken(token: string): SessionUser | null {
  if (!token.startsWith('demo.')) return null
  try {
    const encoded = token.slice(5)
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionUser
  } catch {
    return null
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export async function resolveRoleAccess(): Promise<RoleAccessConfig> {
  const savedConfig = await dataStore.get('configuracoes', 'role-access')
  const value = savedConfig?.valor as Partial<RoleAccessConfig> | undefined

  return {
    admin: value?.admin ?? DEFAULT_ROLE_ACCESS.admin,
    gerente: value?.gerente ?? DEFAULT_ROLE_ACCESS.gerente,
    tecnico: value?.tecnico ?? DEFAULT_ROLE_ACCESS.tecnico,
    operador: value?.operador ?? DEFAULT_ROLE_ACCESS.operador,
  }
}

async function getDemoCredentials(): Promise<DemoCredential[]> {
  const config = await dataStore.get('configuracoes', 'demo-auth')
  const accounts = Array.isArray((config?.valor as { accounts?: unknown[] } | undefined)?.accounts)
    ? ((config?.valor as { accounts: DemoCredential[] }).accounts ?? [])
    : []

  if (accounts.length > 0) return accounts

  return demoAccounts.map(({ email, password, user }) => ({
    email,
    password,
    role: user.role,
    name: user.name,
    staffId: user.staffId,
    userId: user.id,
  }))
}

export async function listDemoCredentialHints() {
  const credentials = await getDemoCredentials()
  return credentials.map(({ email, password, role, name }) => ({ email, password, role, name }))
}

export async function createDemoSession(payload: LoginRequest): Promise<SessionPayload> {
  const credentials = await getDemoCredentials()
  const match = credentials.find(
    (credential) => credential.email.toLowerCase() === payload.email.toLowerCase() && credential.password === payload.password,
  )

  if (!match) {
    throw new HttpError(401, 'Credenciais demo inválidas.')
  }

  const users = await dataStore.list('users')
  const account = users.find((user) => user.email.toLowerCase() === match.email.toLowerCase())
  const sessionUser: SessionUser = {
    id: account?.id ?? match.userId ?? `USR-${match.role.toUpperCase()}`,
    email: match.email,
    name: account?.nome ?? match.name,
    role: account?.role ?? match.role,
    staffId: account?.staffId ?? match.staffId,
    mode: 'demo',
  }

  return {
    token: encodeDemoToken(sessionUser),
    user: sessionUser,
    permissions: await resolveRoleAccess(),
  }
}

async function resolveFirebaseUser(token: string): Promise<SessionUser> {
  const decoded = await getFirebaseAdminAuth().verifyIdToken(token)
  const users = await dataStore.list('users')
  const account = users.find((user) => user.authUid === decoded.uid || user.email.toLowerCase() === String(decoded.email || '').toLowerCase())

  return {
    id: account?.id ?? decoded.uid,
    email: account?.email ?? decoded.email ?? '',
    name: account?.nome ?? decoded.name ?? decoded.email ?? 'Usuário',
    role: account?.role ?? ((decoded.role as SessionUser['role'] | undefined) ?? 'operador'),
    staffId: account?.staffId,
    mode: 'firebase',
  }
}

export async function requireAuth(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      throw new HttpError(401, 'Sessão inválida. Faça login novamente.')
    }

    // Tokens demo são aceitos sempre que o login demo estiver habilitado, mesmo
    // com o armazenamento em Firestore (APP_MODE=firebase). Tokens reais do
    // Firebase Auth continuam sendo verificados normalmente.
    let user: SessionUser | null = null
    if (env.ENABLE_DEMO_LOGIN && token.startsWith('demo.')) {
      user = decodeDemoToken(token)
    } else if (env.APP_MODE === 'demo') {
      user = decodeDemoToken(token)
    } else {
      user = await resolveFirebaseUser(token)
    }
    if (!user) {
      throw new HttpError(401, 'Token inválido.')
    }

    request.user = user
    request.permissions = await resolveRoleAccess()
    next()
  } catch (error) {
    next(error)
  }
}

export function assertCollectionAccess(
  user: SessionUser,
  permissions: RoleAccessConfig,
  collection: CollectionName,
  action: 'read' | 'write',
) {
  if (user.role === 'admin') return

  const moduleId = moduleByCollection[collection]
  if (!moduleId) {
    throw new HttpError(403, 'Coleção não habilitada para este perfil.')
  }

  const allowedModules = permissions[user.role] ?? DEFAULT_ROLE_ACCESS[user.role]
  if (!allowedModules.includes(moduleId)) {
    throw new HttpError(403, 'Seu perfil não possui acesso a este módulo.')
  }

  if (action === 'write' && (collection === 'users' || collection === 'configuracoes')) {
    throw new HttpError(403, 'Somente administradores podem alterar este recurso.')
  }
}