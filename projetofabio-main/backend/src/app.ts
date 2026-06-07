import express from 'express'
import cors from 'cors'
import { APP_MODULES, type CloseServiceOrderRequest, type CreateUserRequest, type InventoryMovementRequest, type LoginRequest } from '@atlasmed/shared'
import { assertCollectionAccess, createDemoSession, listDemoCredentialHints, requireAuth, type AuthenticatedRequest } from './auth.js'
import { getErrorMessage, HttpError } from './errors.js'
import { env } from './env.js'
import { closeServiceOrder, createUserAccount, parseCollection, parseInventoryCollection, applyInventoryMovement } from './operations.js'
import { dataStore } from './store.js'

export const app = express()

function readParam(value: string | string[] | undefined, label: string): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value[0]) return value[0]
  throw new HttpError(400, `Parâmetro obrigatório ausente: ${label}.`)
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Requisições same-origin ou ferramentas (sem header Origin) — sempre liberadas.
      if (!origin) return callback(null, true)

      const normalize = (value: string) => value.trim().replace(/\/+$/, '').toLowerCase()
      const requestOrigin = normalize(origin)

      const allowed = env.FRONTEND_URL.split(',').map(normalize).filter(Boolean)

      // URL da implantação Vercel (definida automaticamente pela Vercel).
      const vercelUrl = process.env['VERCEL_URL']
      if (vercelUrl) allowed.push(normalize(`https://${vercelUrl}`))

      // Curinga, lista vazia ou correspondência explícita → reflete a origem.
      if (allowed.length === 0 || allowed.includes('*') || allowed.includes(requestOrigin)) {
        return callback(null, true)
      }

      // Origem não permitida: não lança erro (evita 500). Apenas omite o cabeçalho CORS.
      return callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_request, response) => {
  const fbConfigured = Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY)
  response.json({
    data: {
      status: 'ok',
      mode: dataStore.mode,
      firebaseConfigured: fbConfigured,
      firebaseProjectId: env.FIREBASE_PROJECT_ID ?? '(não definido)',
      timestamp: new Date().toISOString(),
    },
  })
})

app.post('/api/session/login', async (request, response, next) => {
  try {
    if (env.APP_MODE !== 'demo' && !env.ENABLE_DEMO_LOGIN) {
      throw new HttpError(400, 'No modo firebase, o login é feito no frontend com o SDK do Firebase Auth.')
    }

    const payload = request.body as LoginRequest
    if (!payload.email || !payload.password) {
      throw new HttpError(400, 'Informe email e senha.')
    }

    response.json({ data: await createDemoSession(payload) })
  } catch (error) {
    next(error)
  }
})

app.use('/api', requireAuth)

app.get('/api/session/me', async (request: AuthenticatedRequest, response) => {
  response.json({
    data: {
      user: request.user,
      permissions: request.permissions,
    },
  })
})

app.get('/api/bootstrap', async (request: AuthenticatedRequest, response, next) => {
  try {
    const companyProfile = await dataStore.get('configuracoes', 'company-profile')

    response.json({
      data: {
        mode: dataStore.mode,
        user: request.user,
        permissions: request.permissions,
        modules: APP_MODULES,
        companyProfile: companyProfile?.valor ?? {},
        demoHints: dataStore.mode === 'demo' || env.ENABLE_DEMO_LOGIN ? await listDemoCredentialHints() : [],
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/resources/:collection', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseCollection(readParam(request.params.collection, 'collection'))
    assertCollectionAccess(request.user!, request.permissions!, collection, 'read')
    response.json({ data: await dataStore.list(collection) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/resources/:collection/:id', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseCollection(readParam(request.params.collection, 'collection'))
    const id = readParam(request.params.id, 'id')
    assertCollectionAccess(request.user!, request.permissions!, collection, 'read')
    const item = await dataStore.get(collection, id)
    if (!item) {
      throw new HttpError(404, 'Registro não encontrado.')
    }
    response.json({ data: item })
  } catch (error) {
    next(error)
  }
})

app.post('/api/resources/:collection', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseCollection(readParam(request.params.collection, 'collection'))
    assertCollectionAccess(request.user!, request.permissions!, collection, 'write')
    response.status(201).json({ data: await dataStore.create(collection, request.body) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/resources/:collection/:id', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseCollection(readParam(request.params.collection, 'collection'))
    const id = readParam(request.params.id, 'id')
    assertCollectionAccess(request.user!, request.permissions!, collection, 'write')
    response.json({ data: await dataStore.update(collection, id, request.body) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/resources/:collection/:id', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseCollection(readParam(request.params.collection, 'collection'))
    const id = readParam(request.params.id, 'id')
    assertCollectionAccess(request.user!, request.permissions!, collection, 'write')
    response.json({ data: await dataStore.remove(collection, id) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/inventory/:collection/:id/movements', async (request: AuthenticatedRequest, response, next) => {
  try {
    const collection = parseInventoryCollection(readParam(request.params.collection, 'collection'))
    const id = readParam(request.params.id, 'id')
    assertCollectionAccess(request.user!, request.permissions!, collection, 'write')
    response.json({ data: await applyInventoryMovement(collection, id, request.body as InventoryMovementRequest) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/service-orders/:id/close', async (request: AuthenticatedRequest, response, next) => {
  try {
    const id = readParam(request.params.id, 'id')
    assertCollectionAccess(request.user!, request.permissions!, 'ordensServico', 'write')
    response.json({ data: await closeServiceOrder(id, request.body as CloseServiceOrderRequest) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/users', async (request: AuthenticatedRequest, response, next) => {
  try {
    assertCollectionAccess(request.user!, request.permissions!, 'users', 'write')
    response.status(201).json({ data: await createUserAccount(request.body as CreateUserRequest) })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  void _next

  // Firebase Admin auth errors (invalid/expired token) → 401
  if (error instanceof Error && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (code.startsWith('auth/')) {
      return void response.status(401).json({ error: 'Sessão inválida. Faça login novamente.' })
    }
  }

  const status = error instanceof HttpError ? error.status : 500
  response.status(status).json({
    error: getErrorMessage(error),
  })
})