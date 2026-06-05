import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpError } from './errors.js'
import { env, isFirebaseMode } from './env.js'

function ensureFirebaseApp() {
  if (!isFirebaseMode) {
    throw new HttpError(400, 'O backend está em modo demo. Configure APP_MODE=firebase para usar o Admin SDK.')
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new HttpError(500, 'Credenciais do Firebase Admin incompletas. Revise o backend/.env.')
  }

  if (getApps().length > 0) {
    return getApps()[0]
  }

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    projectId: env.FIREBASE_PROJECT_ID,
  })
}

export function getFirebaseAdminAuth() {
  return getAuth(ensureFirebaseApp())
}

// Cached instance so .settings() is only called once per process.
// preferRest avoids the gRPC persistent-connection requirement that breaks
// Vercel serverless functions (and similar platforms).
let _db: ReturnType<typeof getFirestore> | null = null

export function getFirebaseAdminDb() {
  if (_db) return _db
  _db = getFirestore(ensureFirebaseApp())
  _db.settings({ preferRest: true })
  return _db
}