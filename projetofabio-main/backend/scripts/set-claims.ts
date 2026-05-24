/**
 * Define as Custom Claims (role, staffId) nos usuários do Firebase Authentication.
 * Rode após criar os usuários no Firebase Console.
 *
 * Rodando: npm run set-claims --workspace backend
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env') })

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { demoAccounts } from '@atlasmed/shared'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

if (!projectId || !clientEmail || !rawPrivateKey) {
  console.error('\n❌  Credenciais do Firebase Admin incompletas no backend/.env.\n')
  process.exit(1)
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: rawPrivateKey.replace(/\\n/g, '\n') }),
    projectId,
  })
}

const auth = getAuth()

async function main() {
  console.log('\n🔐  Definindo Custom Claims nos usuários...\n')

  for (const { email, user } of demoAccounts) {
    try {
      const fbUser = await auth.getUserByEmail(email)
      await auth.setCustomUserClaims(fbUser.uid, {
        role: user.role,
        staffId: user.staffId,
      })
      console.log(`  ✓  ${email.padEnd(30)} role=${user.role}  staffId=${user.staffId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗  ${email} — ${message}`)
    }
  }

  console.log('\n✅  Claims definidas! Os usuários já têm acesso correto ao sistema.\n')
}

main().catch((err) => {
  console.error('\n❌  Erro:', err)
  process.exit(1)
})
