import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  // Default to 'firebase' so Vercel never falls back to demo mode accidentally.
  // Set APP_MODE=demo explicitly to enable demo/offline mode.
  APP_MODE: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['demo', 'firebase'])).default('firebase'),
  // Permite o login demo simples (email/senha) mesmo quando o armazenamento é o
  // Firestore real (APP_MODE=firebase). Assim o usuário demo testa criar/editar/
  // apagar com persistência real, sem precisar de usuários no Firebase Auth.
  // Defina ENABLE_DEMO_LOGIN=false para exigir somente login via Firebase Auth.
  ENABLE_DEMO_LOGIN: z.preprocess(
    (v) => (v === undefined || v === '' ? true : String(v).toLowerCase() !== 'false'),
    z.boolean(),
  ),
  FRONTEND_URL: z.string().default('*'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export const isFirebaseMode = env.APP_MODE === 'firebase'