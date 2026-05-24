import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)
}

function ensureFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('As credenciais do Firebase ainda não foram configuradas no frontend/.env.')
  }

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig)
    auth = getAuth(app)
  }

  return auth!
}

export async function firebaseLogin(email: string, password: string) {
  const authClient = ensureFirebase()
  const credential = await signInWithEmailAndPassword(authClient, email, password)
  return credential.user.getIdToken()
}

export async function firebaseLogout() {
  if (!auth) return
  await signOut(auth)
}