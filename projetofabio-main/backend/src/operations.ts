import { calculateCalibrationStatus, type AppRecordMap, type CloseServiceOrderRequest, type CollectionName, type CreateUserRequest, type InventoryMovementRequest, type ItemEstoque, type OrdemServicoConsumo, type UserAccount } from '@atlasmed/shared'
import { getFirebaseAdminAuth } from './firebaseAdmin.js'
import { HttpError } from './errors.js'
import { env } from './env.js'
import { dataStore } from './store.js'

function ensurePositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Informe uma quantidade válida maior que zero.')
  }
}

async function consumeInventoryItem(
  collection: 'pecas' | 'acessorios',
  itemId: string,
  quantity: number,
  serviceOrderId: string,
): Promise<OrdemServicoConsumo> {
  const item = await dataStore.get(collection, itemId)
  if (!item) {
    throw new HttpError(404, `Item ${itemId} não encontrado em ${collection}.`)
  }

  if (Number(item.quantidade || 0) < quantity) {
    throw new HttpError(400, `Estoque insuficiente para ${item.nome}.`)
  }

  const now = new Date().toISOString()
  const saldo = Number(item.quantidade || 0) - quantity
  await dataStore.update(collection, itemId, {
    quantidade: saldo,
    historico: [
      ...(item.historico || []),
      { data: now, tipo: 'Saída', qtd: quantity, saldo, obs: `Consumo na OS ${serviceOrderId}` },
    ],
    updatedAt: now,
  } as Partial<ItemEstoque>)

  return {
    itemId,
    nome: item.nome,
    quantidade: quantity,
  }
}

export async function applyInventoryMovement(
  collection: 'pecas' | 'acessorios',
  id: string,
  payload: InventoryMovementRequest,
) {
  ensurePositiveQuantity(payload.quantidade)
  const record = await dataStore.get(collection, id)
  if (!record) {
    throw new HttpError(404, `Item ${id} não encontrado.`)
  }

  const current = Number(record.quantidade || 0)
  const nextBalance = payload.tipo === 'Entrada' ? current + payload.quantidade : current - payload.quantidade

  if (payload.tipo === 'Saída' && nextBalance < 0) {
    throw new HttpError(400, 'A saída não pode deixar o estoque negativo.')
  }

  if (payload.tipo === 'Entrada' && (!payload.custoUnitario || payload.custoUnitario <= 0)) {
    throw new HttpError(400, 'Informe o custo unitário para registrar uma entrada.')
  }

  const now = new Date().toISOString()
  return dataStore.update(collection, id, {
    quantidade: nextBalance,
    precoCusto: payload.tipo === 'Entrada' && payload.custoUnitario ? payload.custoUnitario : record.precoCusto,
    fornecedorId: payload.tipo === 'Entrada' ? payload.fornecedorId ?? record.fornecedorId : record.fornecedorId,
    historico: [
      ...(record.historico || []),
      {
        data: now,
        tipo: payload.tipo,
        qtd: payload.quantidade,
        saldo: nextBalance,
        obs: payload.observacao,
        custoUnitario: payload.custoUnitario,
        fornecedorId: payload.fornecedorId,
        valorTotal: payload.custoUnitario ? payload.quantidade * payload.custoUnitario : undefined,
      },
    ],
    updatedAt: now,
  } as Partial<ItemEstoque>)
}

export async function closeServiceOrder(id: string, payload: CloseServiceOrderRequest) {
  const order = await dataStore.get('ordensServico', id)
  if (!order) {
    throw new HttpError(404, 'Ordem de serviço não encontrada.')
  }

  const usedParts = await Promise.all(
    (payload.pecasUsadas || [])
      .filter((item) => item.itemId && Number(item.quantidade) > 0)
      .map((item) => consumeInventoryItem('pecas', item.itemId, Number(item.quantidade), id)),
  )

  const usedAccessories = await Promise.all(
    (payload.acessoriosUsados || [])
      .filter((item) => item.itemId && Number(item.quantidade) > 0)
      .map((item) => consumeInventoryItem('acessorios', item.itemId, Number(item.quantidade), id)),
  )

  const closedAt = new Date().toISOString()
  const historyRecord: AppRecordMap['historicoOS'] = {
    ...order,
    status: 'Concluída',
    fechadoEm: closedAt,
    fechamento: {
      funcionarioId: payload.funcionarioId,
      acao: payload.acao,
      problema: payload.problema,
      pecasUsadas: usedParts,
      acessoriosUsados: usedAccessories,
    },
    updatedAt: closedAt,
  }

  await dataStore.create('historicoOS', historyRecord)
  await dataStore.remove('ordensServico', id)

  const equipment = await dataStore.get('equipamentos', order.equipamentoId)
  if (equipment) {
    await dataStore.update('equipamentos', equipment.id, {
      status: 'Em Operação',
      ultimaIntervencao: closedAt,
      updatedAt: closedAt,
    })
  }

  return historyRecord
}

export async function createUserAccount(payload: CreateUserRequest) {
  const existingUsers = await dataStore.list('users')
  if (existingUsers.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new HttpError(409, 'Já existe uma conta com este email.')
  }

  let authUid: string | undefined
  if (env.APP_MODE === 'firebase') {
    if (!payload.password) {
      throw new HttpError(400, 'Informe uma senha para provisionar a conta no Firebase Auth.')
    }

    const authUser = await getFirebaseAdminAuth().createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.nome,
    })
    await getFirebaseAdminAuth().setCustomUserClaims(authUser.uid, { role: payload.role })
    authUid = authUser.uid
  }

  const createdUser = await dataStore.create('users', {
    nome: payload.nome,
    email: payload.email,
    role: payload.role,
    staffId: payload.staffId,
    ativo: true,
    authUid,
  } satisfies Partial<UserAccount>)

  if (env.APP_MODE === 'demo' && payload.password) {
    const credentialsConfig = await dataStore.get('configuracoes', 'demo-auth')
    const currentAccounts = Array.isArray((credentialsConfig?.valor as { accounts?: unknown[] } | undefined)?.accounts)
      ? ((credentialsConfig?.valor as { accounts: Array<Record<string, unknown>> }).accounts ?? [])
      : []

    const nextAccounts = [
      ...currentAccounts,
      {
        email: payload.email,
        password: payload.password,
        role: payload.role,
        name: payload.nome,
        staffId: payload.staffId,
        userId: createdUser.id,
      },
    ]

    if (credentialsConfig) {
      await dataStore.update('configuracoes', credentialsConfig.id, {
        valor: { accounts: nextAccounts },
      })
    }
  }

  if (payload.staffId) {
    const staff = await dataStore.get('funcionarios', payload.staffId)
    if (staff) {
      await dataStore.update('funcionarios', payload.staffId, {
        contaVinculada: authUid ?? createdUser.id,
      })
    }
  }

  return createdUser
}

export async function refreshCalibrationStatus(id: string) {
  const pattern = await dataStore.get('padroesCalibracao', id)
  if (!pattern) {
    throw new HttpError(404, 'Padrão de calibração não encontrado.')
  }

  return dataStore.update('padroesCalibracao', id, {
    status: calculateCalibrationStatus(pattern.validadeCalibracao),
  })
}

export function parseInventoryCollection(collection: string): 'pecas' | 'acessorios' {
  if (collection !== 'pecas' && collection !== 'acessorios') {
    throw new HttpError(400, 'Coleção inválida para movimentação de estoque.')
  }
  return collection
}

export function parseCollection(collection: string): CollectionName {
  const validCollections: CollectionName[] = [
    'clientes',
    'equipamentos',
    'funcionarios',
    'fornecedores',
    'pecas',
    'acessorios',
    'contratos',
    'orcamentos',
    'ordensServico',
    'historicoOS',
    'certificados',
    'rotinasCertificacao',
    'padroesCalibracao',
    'users',
    'configuracoes',
  ]

  if (!validCollections.includes(collection as CollectionName)) {
    throw new HttpError(400, 'Coleção inválida.')
  }

  return collection as CollectionName
}