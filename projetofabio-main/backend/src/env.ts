import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  APP_MODE: z.enum(['demo', 'firebase']).default('demo'),
  FRONTEND_URL: z.string().default('*'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export const isFirebaseMode = env.APP_MODE === 'firebase'