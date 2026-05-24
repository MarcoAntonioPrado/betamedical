/**
 * Seed do Firestore com os dados demo do AtlasMed Beta.
 *
 * Pré-requisito: preencha FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no backend/.env
 * (baixe a chave em Firebase Console > Configurações do projeto > Contas de serviço)
 *
 * Rodando: npm run seed --workspace backend
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env') })

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { initialDemoDatabase, demoAccounts } from '@atlasmed/shared'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

if (!projectId || !clientEmail || !rawPrivateKey) {
  console.error(
    '\n❌  Credenciais do Firebase Admin incompletas.\n' +
      '    Preencha FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY\n' +
      '    no arquivo backend/.env antes de rodar o seed.\n' +
      '    Gere a chave em: Firebase Console > Configurações do projeto > Contas de serviço\n',
  )
  process.exit(1)
}

const privateKey = rawPrivateKey.replace(/\\n/g, '\n')

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
}

const db = getFirestore()

// ── helpers ─────────────────────────────────────────────────────────────────

async function seedCollection(name: string, items: Array<Record<string, unknown>>) {
  const colRef = db.collection(name)
  const batch = db.batch()
  for (const item of items) {
    const docRef = colRef.doc(String(item.id))
    batch.set(docRef, item)
  }
  await batch.commit()
  console.log(`  ✓  ${name.padEnd(22)} ${items.length} documento(s)`)
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔥  Conectado ao projeto: ${projectId}`)
  console.log('📦  Iniciando seed das coleções...\n')

  const collections = Object.entries(initialDemoDatabase) as Array<
    [string, Array<Record<string, unknown>>]
  >

  for (const [name, items] of collections) {
    if (items.length > 0) {
      await seedCollection(name, items as Array<Record<string, unknown>>)
    }
  }

  // Coleção de usuários do sistema (com roles)
  const usersExtra = demoAccounts.map(({ user }) => ({
    id: user.id,
    email: user.email,
    nome: user.name,
    role: user.role,
    staffId: user.staffId,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  // users já está em initialDemoDatabase; isso garante que não fique desatualizado
  await seedCollection('users', usersExtra as Array<Record<string, unknown>>)

  console.log('\n✅  Seed concluído com sucesso!\n')
  console.log('   Próximo passo: crie os usuários no Firebase Authentication com os e-mails abaixo')
  console.log('   e defina as roles via Claims ou via painel de usuários do app.\n')
  for (const { email, password, user } of demoAccounts) {
    console.log(`   ${user.role.padEnd(10)} ${email}  /  senha: ${password}`)
  }
  console.log()
}

main().catch((err) => {
  console.error('\n❌  Erro durante o seed:', err)
  process.exit(1)
})
