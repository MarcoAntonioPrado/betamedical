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

export function getFirebaseAdminDb() {
  return getFirestore(ensureFirebaseApp())
}