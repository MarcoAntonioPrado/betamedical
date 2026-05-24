import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENTITY_CONFIGS, demoAccounts, generatePrefixedId, initialDemoDatabase, type AppMode, type AppRecordMap, type CollectionName, type ConfiguracaoSistema } from '@atlasmed/shared'
import { getFirebaseAdminDb } from './firebaseAdmin.js'
import { env } from './env.js'

type Snapshot = { [Key in keyof AppRecordMap]: AppRecordMap[Key][] }

export interface DataStore {
  mode: AppMode
  list<Key extends keyof AppRecordMap>(collection: Key): Promise<AppRecordMap[Key][]>
  get<Key extends keyof AppRecordMap>(collection: Key, id: string): Promise<AppRecordMap[Key] | null>
  create<Key extends keyof AppRecordMap>(collection: Key, item: Partial<AppRecordMap[Key]> & { id?: string }): Promise<AppRecordMap[Key]>
  update<Key extends keyof AppRecordMap>(collection: Key, id: string, patch: Partial<AppRecordMap[Key]>): Promise<AppRecordMap[Key]>
  remove<Key extends keyof AppRecordMap>(collection: Key, id: string): Promise<boolean>
}

const PREFIX_OVERRIDES: Record<CollectionName, string> = {
  clientes: 'CLI',
  equipamentos: 'EQ',
  funcionarios: 'FUNC',
  fornecedores: 'FOR',
  pecas: 'PEC',
  acessorios: 'ACC',
  contratos: 'CON',
  orcamentos: 'ORC',
  ordensServico: 'OS',
  historicoOS: 'OS',
  certificados: 'CERT',
  rotinasCertificacao: 'ROT',
  padroesCalibracao: 'PAD',
  users: 'USR',
  configuracoes: 'CFG',
}

// On Vercel, /tmp is the only writable directory; otherwise resolve relative to this file
const _storeDir = path.dirname(fileURLToPath(import.meta.url))
const DEMO_DB_PATH = process.env['VERCEL']
  ? '/tmp/atlasmed-demo-db.json'
  : path.resolve(_storeDir, '../data', 'demo-db.json')

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return JSON.parse(JSON.stringify(snapshot)) as Snapshot
}

function getCollectionPrefix(collection: CollectionName): string {
  const config = ENTITY_CONFIGS[collection]
  return config?.prefix ?? PREFIX_OVERRIDES[collection] ?? 'REG'
}

async function ensureDemoDbFile() {
  try {
    await access(DEMO_DB_PATH)
    return
  } catch {
    await mkdir(path.dirname(DEMO_DB_PATH), { recursive: true })
  }

  const snapshot = cloneSnapshot(initialDemoDatabase as Snapshot)
  const existingDemoConfig = snapshot.configuracoes.find((item) => item.id === 'demo-auth')
  if (!existingDemoConfig) {
    snapshot.configuracoes.push({
      id: 'demo-auth',
      nome: 'Credenciais demo',
      descricao: 'Credenciais locais usadas apenas para o modo demo.',
      valor: {
        accounts: demoAccounts.map(({ email, password, user }) => ({
          email,
          password,
          role: user.role,
          name: user.name,
          staffId: user.staffId,
          userId: user.id,
        })),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies ConfiguracaoSistema)
  }

  await writeFile(DEMO_DB_PATH, JSON.stringify(snapshot, null, 2), 'utf-8')
}

async function readDemoDb(): Promise<Snapshot> {
  await ensureDemoDbFile()
  const raw = await readFile(DEMO_DB_PATH, 'utf-8')
  return JSON.parse(raw) as Snapshot
}

async function writeDemoDb(snapshot: Snapshot) {
  await writeFile(DEMO_DB_PATH, JSON.stringify(snapshot, null, 2), 'utf-8')
}

function prepareRecord<Key extends keyof AppRecordMap>(
  collection: Key,
  records: AppRecordMap[Key][],
  item: Partial<AppRecordMap[Key]> & { id?: string },
  current?: AppRecordMap[Key],
): AppRecordMap[Key] {
  const timestamp = new Date().toISOString()
  const prefix = getCollectionPrefix(collection as CollectionName)
  const id = item.id && String(item.id).trim().length > 0 ? item.id : current?.id ?? generatePrefixedId(records as Array<{ id: string }>, prefix)

  return {
    ...(current ?? {}),
    ...(item as AppRecordMap[Key]),
    id,
    createdAt: current?.createdAt ?? item.createdAt ?? timestamp,
    updatedAt: timestamp,
  } as AppRecordMap[Key]
}

const demoStore: DataStore = {
  mode: 'demo',
  async list(collection) {
    const snapshot = await readDemoDb()
    return cloneSnapshot({ ...snapshot, [collection]: snapshot[collection] })[collection]
  },
  async get(collection, id) {
    const snapshot = await readDemoDb()
    return snapshot[collection].find((item) => item.id === id) ?? null
  },
  async create(collection, item) {
    const snapshot = await readDemoDb()
    const records = snapshot[collection]
    const prepared = prepareRecord(collection, records, item)
    records.unshift(prepared)
    await writeDemoDb(snapshot)
    return prepared
  },
  async update(collection, id, patch) {
    const snapshot = await readDemoDb()
    const index = snapshot[collection].findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error(`Registro ${id} não encontrado em ${collection}.`)
    }
    const current = snapshot[collection][index]
    const prepared = prepareRecord(collection, snapshot[collection], patch, current)
    snapshot[collection][index] = prepared
    await writeDemoDb(snapshot)
    return prepared
  },
  async remove(collection, id) {
    const snapshot = await readDemoDb()
    const nextItems = snapshot[collection].filter((item) => item.id !== id)
    const removed = nextItems.length !== snapshot[collection].length
    snapshot[collection] = nextItems as Snapshot[typeof collection]
    await writeDemoDb(snapshot)
    return removed
  },
}

const firebaseStore: DataStore = {
  mode: 'firebase',
  async list(collection) {
    const db = getFirebaseAdminDb()
    const snapshot = await db.collection(collection).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) })) as AppRecordMap[typeof collection][]
  },
  async get(collection, id) {
    const db = getFirebaseAdminDb()
    const docRef = await db.collection(collection).doc(id).get()
    if (!docRef.exists) return null
    return { id: docRef.id, ...(docRef.data() as object) } as AppRecordMap[typeof collection]
  },
  async create(collection, item) {
    const db = getFirebaseAdminDb()
    const records = await firebaseStore.list(collection)
    const prepared = prepareRecord(collection, records, item)
    await db.collection(collection).doc(prepared.id).set(prepared)
    return prepared
  },
  async update(collection, id, patch) {
    const current = await firebaseStore.get(collection, id)
    if (!current) {
      throw new Error(`Registro ${id} não encontrado em ${collection}.`)
    }
    const records = await firebaseStore.list(collection)
    const prepared = prepareRecord(collection, records, patch, current)
    await getFirebaseAdminDb().collection(collection).doc(id).set(prepared)
    return prepared
  },
  async remove(collection, id) {
    const db = getFirebaseAdminDb()
    await db.collection(collection).doc(id).delete()
    return true
  },
}

export const dataStore: DataStore = env.APP_MODE === 'firebase' ? firebaseStore : demoStore