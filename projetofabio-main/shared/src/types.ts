export type Role = 'admin' | 'gerente' | 'tecnico' | 'operador'

export type AppMode = 'demo' | 'firebase'

export type ModuleId =
  | 'dashboard'
  | 'financeiro'
  | 'ordens-servico'
  | 'historico-os'
  | 'equipamentos'
  | 'orcamentos'
  | 'funcionarios'
  | 'clientes'
  | 'contratos'
  | 'certificados'
  | 'fornecedores'
  | 'pecas'
  | 'acessorios'
  | 'padroes-calibracao'
  | 'usuarios'
  | 'configuracoes'

export type CollectionName =
  | 'clientes'
  | 'equipamentos'
  | 'funcionarios'
  | 'fornecedores'
  | 'pecas'
  | 'acessorios'
  | 'contratos'
  | 'orcamentos'
  | 'ordensServico'
  | 'historicoOS'
  | 'certificados'
  | 'rotinasCertificacao'
  | 'padroesCalibracao'
  | 'users'
  | 'configuracoes'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  staffId?: string
  mode: AppMode
}

export interface SessionPayload {
  token: string
  user: SessionUser
  permissions: RoleAccessConfig
}

export type RoleAccessConfig = Record<Role, ModuleId[]>

export interface ResourceBase {
  id: string
  createdAt?: string
  updatedAt?: string
  notes?: string
}

export interface Cliente extends ResourceBase {
  nome: string
  documento: string
  email?: string
  telefone?: string
  telefoneSecundario?: string
  pessoaContato?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
}

export interface Equipamento extends ResourceBase {
  nome: string
  modelo: string
  fabricante?: string
  numeroSerie: string
  numeroPatrimonio?: string
  tag?: string
  clienteId?: string
  hospital?: string
  setor?: string
  local: string
  tipo?: string
  classeRisco?: 'I' | 'IIa' | 'IIb' | 'III'
  classeEquipamento?: 'B' | 'BF' | 'CF'
  status: EquipmentStatus
  dataAquisicao?: string
  dataInstalacao?: string
  ultimaIntervencao?: string
  proximaCalibracao?: string
  proximaManutencaoPreventiva?: string
  observacoes?: string
}

export interface Funcionario extends ResourceBase {
  nome: string
  cargo: string
  email: string
  telefone?: string
  contaVinculada?: string
  especialidade?: string
  ativo: boolean
}

export interface Fornecedor extends ResourceBase {
  nome: string
  razaoSocial?: string
  cnpj?: string
  responsavel?: string
  email?: string
  telefone?: string
  endereco?: string
  categoria?: string
  produtosServicos?: string
  observacoes?: string
}

export interface MovimentoEstoque {
  data: string
  tipo: 'Entrada' | 'Saída' | 'Ajuste' | 'Criação' | 'Atualização'
  qtd: number
  saldo: number
  obs?: string
  custoUnitario?: number
  fornecedorId?: string
  valorTotal?: number
}

export interface ItemEstoque extends ResourceBase {
  codigo: string
  nome: string
  descricao?: string
  fornecedorId?: string
  localizacao?: string
  unidade: string
  quantidade: number
  minimo: number
  precoCusto: number
  precoVenda: number
  status: InventoryStatus
  historico: MovimentoEstoque[]
}

export interface OrcamentoItem {
  tipo: 'Servico' | 'Peça' | 'Acessório'
  descricao: string
  quantidade: number
  valorUnitario: number
  pecaId?: string
  acessorioId?: string
}

export interface Orcamento extends ResourceBase {
  clienteId: string
  equipamentoId?: string
  osId?: string
  data: string
  status: BudgetStatus
  prazoExecucao?: string
  validadeProposta?: string
  desconto?: number
  observacoes?: string
  itens: OrcamentoItem[]
  subtotal: number
  total: number
}

export interface Contrato extends ResourceBase {
  clienteId: string
  tipo: ContractType
  status: ContractStatus
  inicioVigencia: string
  fimVigencia: string
  valorMensal: number
  valorTotal: number
  formaPagamento?: string
  sla?: string
  escopo?: string
  responsavelCliente?: string
  emailCliente?: string
  telefoneCliente?: string
  observacoes?: string
}

export interface OrdemServicoConsumo {
  itemId: string
  nome: string
  quantidade: number
}

export interface OrdemServicoFechamento {
  funcionarioId: string
  acao: string
  problema: string
  pecasUsadas: OrdemServicoConsumo[]
  acessoriosUsados: OrdemServicoConsumo[]
}

export interface OrdemServico extends ResourceBase {
  clienteId: string
  equipamentoId: string
  funcionarioId?: string
  orcamentoId?: string
  descricao: string
  localizacao?: string
  data: string
  status: ServiceOrderStatus
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica'
  servicosExecutados?: string
  fechadoEm?: string
  fechamento?: OrdemServicoFechamento
}

export type TipoCertificado =
  | 'preventiva'
  | 'calibracao'
  | 'corretiva'
  | 'inspecao'
  | 'seguranca-eletrica'
  | 'qualificacao'

export interface EtapaRotina {
  id: string
  titulo: string
  descricao?: string
  checklist: Array<{ item: string; obrigatorio: boolean }>
  campos: Array<{ nome: string; tipo: 'texto' | 'numero' | 'select' | 'boolean'; referencia?: string; unidade?: string; tolerancia?: string; obrigatorio: boolean }>
}

export interface RotinaCertificacao extends ResourceBase {
  nome: string
  tipo: TipoCertificado
  equipamentoTipo: string
  descricao?: string
  campos: Array<{ nome: string; referencia?: string; unidade?: string }>
  etapas?: EtapaRotina[]
  criteriosAprovacao?: string
  ativo?: boolean
}

export interface MedicaoCalibracao {
  pontoNominal: string
  valorMedido: string
  erroEncontrado?: string
  incerteza?: string
  tolerancia?: string
  resultado: 'Conforme' | 'Não Conforme'
}

export interface ResultadoSegurancaEletrica {
  correnteFugaTerra?: string
  correnteFugaInvolucro?: string
  correnteFugaPaciente?: string
  resistenciaTerra?: string
  tensaoAplicada?: string
  isolacao?: string
  limiteCorrenteFuga?: string
  limiteResistenciaTerra?: string
  resultado: 'Aprovado' | 'Reprovado'
}

export interface CondicoesAmbientais {
  temperatura?: string
  umidade?: string
  pressao?: string
  tensaoRede?: string
}

export interface Certificado extends ResourceBase {
  numeroCertificado?: string
  equipamentoId: string
  equipamentoNome: string
  equipamentoNumeroSerie: string
  equipamentoTag?: string
  equipamentoPatrimonio?: string
  rotinaId?: string
  rotinaNome?: string
  padraoId?: string
  padraoNome?: string
  osId?: string
  clienteId?: string
  clienteNome?: string
  tecnicoNome: string
  tecnicoRegistro?: string
  tipo: TipoCertificado
  data: string
  proximaData?: string
  statusGeral: 'aprovado' | 'reprovado' | 'em-andamento'
  observacoes?: string
  conclusaoTecnica?: string
  recomendacoes?: string
  checklist: Array<{ nome: string; status: 'ok' | 'nok' | 'conforme' | 'nao-conforme'; medicao?: string }>
  medicoes?: MedicaoCalibracao[]
  segurancaEletrica?: ResultadoSegurancaEletrica
  condicoesAmbientais?: CondicoesAmbientais
  versao?: number
  assinado?: boolean
  assinadoPor?: string
  assinadoEm?: string
}

export interface PadraoCalibracao extends ResourceBase {
  nome: string
  tipo: string
  numeroSerie: string
  fabricante?: string
  dataCalibracao: string
  validadeCalibracao: string
  responsavel?: string
  status: CalibrationStatus
  observacoes?: string
}

export interface UserAccount extends ResourceBase {
  email: string
  nome: string
  role: Role
  staffId?: string
  ativo: boolean
  authUid?: string
}

export interface ConfiguracaoSistema extends ResourceBase {
  nome: string
  descricao?: string
  valor: Record<string, unknown>
}

export interface AppRecordMap {
  clientes: Cliente
  equipamentos: Equipamento
  funcionarios: Funcionario
  fornecedores: Fornecedor
  pecas: ItemEstoque
  acessorios: ItemEstoque
  contratos: Contrato
  orcamentos: Orcamento
  ordensServico: OrdemServico
  historicoOS: OrdemServico
  certificados: Certificado
  rotinasCertificacao: RotinaCertificacao
  padroesCalibracao: PadraoCalibracao
  users: UserAccount
  configuracoes: ConfiguracaoSistema
}

export interface ApiEnvelope<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateUserRequest {
  nome: string
  email: string
  role: Role
  password?: string
  staffId?: string
}

export interface InventoryMovementRequest {
  tipo: 'Entrada' | 'Saída'
  quantidade: number
  observacao?: string
  custoUnitario?: number
  fornecedorId?: string
}

export interface CloseServiceOrderRequest {
  funcionarioId: string
  acao: string
  problema: string
  pecasUsadas: Array<{ itemId: string; quantidade: number }>
  acessoriosUsados: Array<{ itemId: string; quantidade: number }>
}

export type EquipmentStatus = 'Em Operação' | 'Em Manutenção' | 'Aguardando Peça' | 'Fora de Uso'

export type InventoryStatus = 'Ativo' | 'Inativo'

export type BudgetStatus = 'Em elaboração' | 'Enviado' | 'Aprovado' | 'Rejeitado' | 'Faturado'

export type ContractStatus = 'Ativo' | 'Pendente' | 'Suspenso' | 'Encerrado'

export type ContractType = 'Manutenção' | 'Locação' | 'Suporte' | 'Assistência Técnica' | 'Outro'

export type ServiceOrderStatus =
  | 'Aguardando Início'
  | 'Em Manutenção'
  | 'Aguardando Peça'
  | 'Aguardando Cliente'
  | 'Em Teste'
  | 'Pronto para Retirada'
  | 'Concluída'

export type CalibrationStatus = 'Válido' | 'Vencendo' | 'Vencido'

export type ModuleKind =
  | 'dashboard'
  | 'finance'
  | 'service-orders'
  | 'history'
  | 'entity'
  | 'inventory'
  | 'certificates'
  | 'users'
  | 'settings'

export interface SelectOption {
  label: string
  value: string
}

export interface RelationSpec {
  collection: CollectionName
  labelKey: string
}

export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'number' | 'currency' | 'select' | 'relation' | 'status' | 'checkbox'

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: SelectOption[]
  relation?: RelationSpec
  min?: number
  step?: number
  multilineRows?: number
}

export interface ColumnDefinition {
  key: string
  label: string
  type?: 'text' | 'date' | 'currency' | 'status' | 'boolean'
}

export interface EntityConfig {
  collection: CollectionName
  moduleId: ModuleId
  singularLabel: string
  pluralLabel: string
  description: string
  prefix: string
  searchableKeys: string[]
  fields: FieldDefinition[]
  columns: ColumnDefinition[]
}

export interface AppModuleDefinition {
  id: ModuleId
  label: string
  shortLabel: string
  kind: ModuleKind
  description: string
  collection?: CollectionName
}