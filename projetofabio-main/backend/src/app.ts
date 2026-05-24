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
      // Same-origin requests (Vercel) have no Origin header — always allow.
      if (!origin) return callback(null, true)
      const allowed = env.FRONTEND_URL.split(',').map((u) => u.trim())
      // Wildcard or explicit match
      if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origem não permitida — ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_request, response) => {
  response.json({
    data: {
      status: 'ok',
      mode: dataStore.mode,
      timestamp: new Date().toISOString(),
    },
  })
})

app.post('/api/session/login', async (request, response, next) => {
  try {
    if (env.APP_MODE !== 'demo') {
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

app.get('/api/bootstrap', async (request: AuthenticatedRequest, response) => {
  const companyProfile = await dataStore.get('configuracoes', 'company-profile')

  response.json({
    data: {
      mode: dataStore.mode,
      user: request.user,
      permissions: request.permissions,
      modules: APP_MODULES,
      companyProfile: companyProfile?.valor ?? {},
      demoHints: dataStore.mode === 'demo' ? await listDemoCredentialHints() : [],
    },
  })
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
  const status = error instanceof HttpError ? error.status : 500
  response.status(status).json({
    error: getErrorMessage(error),
  })
})