import { formatCurrency, formatDate } from '@atlasmed/shared'

/**
 * Perfil institucional usado no cabeçalho/rodapé de todos os documentos.
 * Os dados são puxados das configurações da empresa (módulo Configurações).
 */
export interface CompanyProfile {
  nomeEmpresa: string
  tagline: string
  cnpj: string
  endereco: string
  cidadeBase: string
  telefone: string
  email: string
  site: string
  responsavelTecnico: string
  registroTecnico: string
}

const DEFAULT_COMPANY: CompanyProfile = {
  nomeEmpresa: 'AtlasMed Engenharia Clínica',
  tagline: 'Gestão de Equipamentos Médicos',
  cnpj: '',
  endereco: '',
  cidadeBase: '',
  telefone: '',
  email: '',
  site: '',
  responsavelTecnico: '',
  registroTecnico: '',
}

/** Normaliza o registro bruto de configurações em um CompanyProfile completo. */
export function normalizeCompanyProfile(raw: Record<string, unknown> | undefined | null): CompanyProfile {
  const value = (raw ?? {}) as Record<string, unknown>
  const pick = (key: string, fallback = '') => {
    const v = value[key]
    return v === undefined || v === null ? fallback : String(v)
  }
  return {
    nomeEmpresa: pick('nomeEmpresa', DEFAULT_COMPANY.nomeEmpresa),
    tagline: pick('tagline', DEFAULT_COMPANY.tagline),
    cnpj: pick('cnpj'),
    endereco: pick('endereco'),
    cidadeBase: pick('cidadeBase'),
    telefone: pick('telefone'),
    email: pick('email'),
    site: pick('site'),
    responsavelTecnico: pick('responsavelTecnico'),
    registroTecnico: pick('registroTecnico'),
  }
}

/** Escapa caracteres especiais para evitar HTML malformado/injeção na janela de impressão. */
export function escapeHtml(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function fmtDate(value: unknown): string {
  const text = value ? String(value) : ''
  return text ? formatDate(text) : '—'
}

export function fmtMoney(value: unknown): string {
  return formatCurrency(Number(value ?? 0))
}

function dash(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value).trim()
  return text ? escapeHtml(text) : '—'
}

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; background: #fff; }
  @page { size: A4; margin: 14mm 14mm 16mm 14mm; }
  .page { max-width: 210mm; margin: 0 auto; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
  .company-name { font-size: 15pt; font-weight: bold; color: #1e40af; }
  .company-tagline { font-size: 8.5pt; color: #555; margin-top: 2px; }
  .company-meta { font-size: 7.8pt; color: #666; margin-top: 6px; line-height: 1.5; }
  .doc-title-box { text-align: right; min-width: 180px; }
  .doc-title-box h1 { font-size: 13pt; font-weight: bold; color: #1e40af; text-transform: uppercase; }
  .doc-num { font-size: 9pt; color: #555; margin-top: 3px; }
  .badge { display: inline-block; padding: 3px 14px; border-radius: 20px; font-weight: bold; font-size: 9pt; color: #fff; margin-top: 6px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 6px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .kv { margin-bottom: 4px; }
  .kv span { font-size: 8pt; color: #666; display: block; }
  .kv strong { font-size: 9.5pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th { background: #eff6ff; text-align: left; padding: 5px 7px; font-weight: bold; border: 1px solid #dbe3ef; }
  td { padding: 5px 7px; border: 1px solid #dbe3ef; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .text-block { font-size: 9pt; line-height: 1.6; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 38px; white-space: pre-wrap; }
  .totals { width: 280px; margin-left: auto; margin-top: 10px; }
  .totals td { border: none; padding: 3px 6px; }
  .totals .total-row td { border-top: 2px solid #1e40af; font-size: 11pt; font-weight: bold; color: #1e40af; padding-top: 6px; }
  .num { text-align: right; }
  .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 8pt; color: #444; }
  .doc-footer { margin-top: 18px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; gap: 10px; font-size: 7.8pt; color: #777; }
  @media print { .no-print { display: none !important; } }
`

function headerHtml(company: CompanyProfile, title: string, docNumber?: string, badge?: { label: string; color: string }): string {
  const metaParts: string[] = []
  if (company.cnpj) metaParts.push(`CNPJ: ${escapeHtml(company.cnpj)}`)
  const localParts = [company.endereco, company.cidadeBase].filter(Boolean).map(escapeHtml)
  if (localParts.length) metaParts.push(localParts.join(' · '))
  const contactParts = [company.telefone, company.email, company.site].filter(Boolean).map(escapeHtml)
  if (contactParts.length) metaParts.push(contactParts.join(' · '))

  return `
  <div class="doc-header">
    <div>
      <div class="company-name">${escapeHtml(company.nomeEmpresa)}</div>
      ${company.tagline ? `<div class="company-tagline">${escapeHtml(company.tagline)}</div>` : ''}
      ${metaParts.length ? `<div class="company-meta">${metaParts.join('<br>')}</div>` : ''}
    </div>
    <div class="doc-title-box">
      <h1>${escapeHtml(title)}</h1>
      ${docNumber ? `<div class="doc-num">Nº ${escapeHtml(docNumber)}</div>` : ''}
      ${badge ? `<div class="badge" style="background:${badge.color}">${escapeHtml(badge.label)}</div>` : ''}
    </div>
  </div>`
}

function footerHtml(company: CompanyProfile, right: string): string {
  return `
  <div class="doc-footer">
    <span>${escapeHtml(company.nomeEmpresa)}${company.cnpj ? ` · CNPJ ${escapeHtml(company.cnpj)}` : ''}</span>
    <span>${escapeHtml(right)}</span>
    <span>Emitido em ${fmtDate(new Date().toISOString())}</span>
  </div>`
}

function signatureHtml(leftName: string, leftRole: string, rightRole = 'Aprovação do Cliente / Gestor'): string {
  return `
  <div class="sig-block">
    <div><div class="sig-line"><strong>${dash(leftName)}</strong><br>${escapeHtml(leftRole)}</div></div>
    <div><div class="sig-line">___________________________<br>${escapeHtml(rightRole)}</div></div>
  </div>`
}

/** Abre uma janela de impressão com o documento gerado e dispara o diálogo de PDF. */
export function openPrintWindow(documentTitle: string, bodyHtml: string): void {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(documentTitle)}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="page">
${bodyHtml}
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=920,height=720')
  if (!win) {
    alert('Popup bloqueado. Permita popups neste site para gerar o PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

// ----------------------------------------------------------------------------
// Documento: cliente / parte (bloco reutilizável)
// ----------------------------------------------------------------------------

function clientBlockHtml(title: string, cliente?: Record<string, unknown> | null): string {
  if (!cliente) {
    return `<div class="section"><div class="section-title">${escapeHtml(title)}</div><div class="kv"><strong>—</strong></div></div>`
  }
  const enderecoLinha = [cliente.endereco, cliente.numero, cliente.bairro].filter(Boolean).join(', ')
  const cidadeLinha = [cliente.cidade, cliente.estado, cliente.cep].filter(Boolean).join(' · ')
  return `
  <div class="section">
    <div class="section-title">${escapeHtml(title)}</div>
    <div class="kv"><span>Nome / Razão Social</span><strong>${dash(cliente.nome)}</strong></div>
    ${cliente.documento ? `<div class="kv"><span>CNPJ / CPF</span><strong>${dash(cliente.documento)}</strong></div>` : ''}
    ${enderecoLinha ? `<div class="kv"><span>Endereço</span><strong>${dash(enderecoLinha)}</strong></div>` : ''}
    ${cidadeLinha ? `<div class="kv"><span>Cidade / UF</span><strong>${dash(cidadeLinha)}</strong></div>` : ''}
    ${cliente.telefone ? `<div class="kv"><span>Telefone</span><strong>${dash(cliente.telefone)}</strong></div>` : ''}
    ${cliente.email ? `<div class="kv"><span>E-mail</span><strong>${dash(cliente.email)}</strong></div>` : ''}
    ${cliente.pessoaContato ? `<div class="kv"><span>Contato</span><strong>${dash(cliente.pessoaContato)}</strong></div>` : ''}
  </div>`
}

function equipmentBlockHtml(equipamento?: Record<string, unknown> | null): string {
  if (!equipamento) return ''
  return `
  <div class="section">
    <div class="section-title">Dados do Equipamento</div>
    <div class="kv"><span>Equipamento</span><strong>${dash(equipamento.nome)}</strong></div>
    ${equipamento.fabricante ? `<div class="kv"><span>Fabricante</span><strong>${dash(equipamento.fabricante)}</strong></div>` : ''}
    ${equipamento.modelo ? `<div class="kv"><span>Modelo</span><strong>${dash(equipamento.modelo)}</strong></div>` : ''}
    ${equipamento.numeroSerie ? `<div class="kv"><span>Nº de Série</span><strong>${dash(equipamento.numeroSerie)}</strong></div>` : ''}
    ${equipamento.numeroPatrimonio ? `<div class="kv"><span>Patrimônio</span><strong>${dash(equipamento.numeroPatrimonio)}</strong></div>` : ''}
    ${equipamento.tag ? `<div class="kv"><span>TAG</span><strong>${dash(equipamento.tag)}</strong></div>` : ''}
    ${equipamento.setor ? `<div class="kv"><span>Setor</span><strong>${dash(equipamento.setor)}</strong></div>` : ''}
    ${equipamento.local ? `<div class="kv"><span>Local</span><strong>${dash(equipamento.local)}</strong></div>` : ''}
  </div>`
}

// ----------------------------------------------------------------------------
// Documento: Orçamento / Proposta
// ----------------------------------------------------------------------------

export interface BudgetDocumentInput {
  company: CompanyProfile
  budget: Record<string, unknown>
  cliente?: Record<string, unknown> | null
  equipamento?: Record<string, unknown> | null
}

const BUDGET_STATUS_COLORS: Record<string, string> = {
  'Em elaboração': '#64748b',
  Enviado: '#2563eb',
  Aprovado: '#16a34a',
  Rejeitado: '#dc2626',
  Faturado: '#7c3aed',
}

export function printBudgetDocument({ company, budget, cliente, equipamento }: BudgetDocumentInput): void {
  const itens = (budget.itens as Array<Record<string, unknown>> | undefined) ?? []
  const subtotal = Number(budget.subtotal ?? 0)
  const desconto = Number(budget.desconto ?? 0)
  const total = Number(budget.total ?? subtotal - desconto)
  const status = String(budget.status ?? 'Em elaboração')
  const badge = { label: status.toUpperCase(), color: BUDGET_STATUS_COLORS[status] ?? '#64748b' }
  const docId = String(budget.id ?? '')

  const itemRows = itens.length
    ? itens.map((item, index) => {
        const qtd = Number(item.quantidade ?? 0)
        const unit = Number(item.valorUnitario ?? 0)
        return `<tr>
          <td>${index + 1}</td>
          <td>${dash(item.tipo)}</td>
          <td>${dash(item.descricao)}</td>
          <td class="num">${qtd}</td>
          <td class="num">${fmtMoney(unit)}</td>
          <td class="num">${fmtMoney(qtd * unit)}</td>
        </tr>`
      }).join('')
    : `<tr><td colspan="6" style="text-align:center;color:#888">Nenhum item adicionado.</td></tr>`

  const body = `
  ${headerHtml(company, 'Orçamento / Proposta', docId, badge)}

  <div class="two-col">
    ${clientBlockHtml('Cliente', cliente)}
    <div class="section">
      <div class="section-title">Dados da Proposta</div>
      <div class="kv"><span>Data de Emissão</span><strong>${fmtDate(budget.data)}</strong></div>
      ${budget.validadeProposta ? `<div class="kv"><span>Validade da Proposta</span><strong>${fmtDate(budget.validadeProposta)}</strong></div>` : ''}
      ${budget.prazoExecucao ? `<div class="kv"><span>Prazo de Execução</span><strong>${dash(budget.prazoExecucao)}</strong></div>` : ''}
      ${budget.osId ? `<div class="kv"><span>OS Vinculada</span><strong>${dash(budget.osId)}</strong></div>` : ''}
      <div class="kv"><span>Status</span><strong>${escapeHtml(status)}</strong></div>
    </div>
  </div>

  ${equipmentBlockHtml(equipamento)}

  <div class="section">
    <div class="section-title">Itens da Proposta</div>
    <table>
      <thead>
        <tr><th style="width:28px">#</th><th style="width:80px">Tipo</th><th>Descrição</th><th class="num" style="width:50px">Qtd</th><th class="num" style="width:90px">Valor Unit.</th><th class="num" style="width:100px">Subtotal</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td class="num">${fmtMoney(subtotal)}</td></tr>
      ${desconto ? `<tr><td>Desconto</td><td class="num">- ${fmtMoney(desconto)}</td></tr>` : ''}
      <tr class="total-row"><td>Total</td><td class="num">${fmtMoney(total)}</td></tr>
    </table>
  </div>

  ${budget.observacoes ? `
  <div class="section">
    <div class="section-title">Observações</div>
    <div class="text-block">${escapeHtml(budget.observacoes)}</div>
  </div>` : ''}

  ${signatureHtml(company.responsavelTecnico || company.nomeEmpresa, company.registroTecnico || 'Responsável Técnico', 'Aceite do Cliente')}

  ${footerHtml(company, `Orçamento ${docId}`)}`

  openPrintWindow(`Orçamento ${docId}`, body)
}

// ----------------------------------------------------------------------------
// Documento: Ordem de Serviço (ativa e histórico)
// ----------------------------------------------------------------------------

export interface ServiceOrderDocumentInput {
  company: CompanyProfile
  order: Record<string, unknown>
  cliente?: Record<string, unknown> | null
  equipamento?: Record<string, unknown> | null
  tecnicoNome?: string
  resolveItemName?: (id: string) => string
  isHistory?: boolean
}

const OS_STATUS_COLORS: Record<string, string> = {
  Concluída: '#16a34a',
  'Em Manutenção': '#d97706',
  'Aguardando Peça': '#dc2626',
  'Aguardando Início': '#2563eb',
}

export function printServiceOrderDocument({ company, order, cliente, equipamento, tecnicoNome, resolveItemName, isHistory }: ServiceOrderDocumentInput): void {
  const status = String(order.status ?? '')
  const badge = { label: status.toUpperCase(), color: OS_STATUS_COLORS[status] ?? '#2563eb' }
  const docId = String(order.id ?? '')
  const fechamento = order.fechamento as Record<string, unknown> | undefined
  const pecas = (fechamento?.pecasUsadas as Array<Record<string, unknown>> | undefined) ?? []
  const acessorios = (fechamento?.acessoriosUsados as Array<Record<string, unknown>> | undefined) ?? []
  const consumo = [...pecas, ...acessorios]

  const consumoTable = consumo.length
    ? `<div class="section">
        <div class="section-title">Peças e Acessórios Utilizados</div>
        <table>
          <thead><tr><th>Item</th><th class="num" style="width:80px">Quantidade</th></tr></thead>
          <tbody>${consumo.map((item) => `<tr><td>${dash(item.nome ?? (resolveItemName ? resolveItemName(String(item.itemId ?? '')) : item.itemId))}</td><td class="num">${Number(item.quantidade ?? 0)}</td></tr>`).join('')}</tbody>
        </table>
      </div>`
    : ''

  const body = `
  ${headerHtml(company, isHistory ? 'Ordem de Serviço — Histórico' : 'Ordem de Serviço', docId, badge)}

  <div class="two-col">
    ${clientBlockHtml('Cliente', cliente)}
    <div class="section">
      <div class="section-title">Dados da Ordem de Serviço</div>
      <div class="kv"><span>Data de Abertura</span><strong>${fmtDate(order.data)}</strong></div>
      ${order.fechadoEm ? `<div class="kv"><span>Data de Encerramento</span><strong>${fmtDate(order.fechadoEm)}</strong></div>` : ''}
      <div class="kv"><span>Prioridade</span><strong>${dash(order.prioridade)}</strong></div>
      <div class="kv"><span>Status</span><strong>${escapeHtml(status)}</strong></div>
      <div class="kv"><span>Técnico Responsável</span><strong>${dash(tecnicoNome)}</strong></div>
      ${order.orcamentoId ? `<div class="kv"><span>Orçamento Vinculado</span><strong>${dash(order.orcamentoId)}</strong></div>` : ''}
    </div>
  </div>

  ${equipmentBlockHtml(equipamento)}
  ${!equipamento && order.localizacao ? `<div class="section"><div class="section-title">Localização</div><div class="kv"><strong>${dash(order.localizacao)}</strong></div></div>` : ''}

  <div class="section">
    <div class="section-title">Descrição do Problema / Serviço Solicitado</div>
    <div class="text-block">${dash(order.descricao)}</div>
  </div>

  ${order.servicosExecutados ? `
  <div class="section">
    <div class="section-title">Serviços Executados</div>
    <div class="text-block">${escapeHtml(order.servicosExecutados)}</div>
  </div>` : ''}

  ${fechamento ? `
  <div class="section">
    <div class="section-title">Encerramento Técnico</div>
    <div class="kv"><span>Ação Corretiva Executada</span><strong>${dash(fechamento.acao)}</strong></div>
    <div class="kv"><span>Causa Raiz / Problema Identificado</span><strong>${dash(fechamento.problema)}</strong></div>
  </div>` : ''}

  ${consumoTable}

  ${signatureHtml(tecnicoNome || company.responsavelTecnico, 'Técnico Responsável')}

  ${footerHtml(company, `OS ${docId}`)}`

  openPrintWindow(`OS ${docId}`, body)
}

// ----------------------------------------------------------------------------
// Documento genérico (entidades / estoque)
// ----------------------------------------------------------------------------

export interface GenericDocumentGroup {
  title: string
  rows: Array<{ label: string; value: string }>
}

export interface GenericDocumentTable {
  title: string
  head: string[]
  rows: string[][]
}

export interface GenericDocumentInput {
  company: CompanyProfile
  documentLabel: string
  title: string
  recordId?: string
  status?: { label: string; color?: string }
  groups: GenericDocumentGroup[]
  tables?: GenericDocumentTable[]
  notes?: string
  withSignature?: boolean
}

export function printGenericDocument(input: GenericDocumentInput): void {
  const { company, documentLabel, title, recordId, status, groups, tables, notes, withSignature } = input
  const badge = status ? { label: status.label.toUpperCase(), color: status.color ?? '#1e40af' } : undefined

  const groupsHtml = groups
    .filter((group) => group.rows.some((row) => row.value && row.value !== '—'))
    .map((group) => `
    <div class="section">
      <div class="section-title">${escapeHtml(group.title)}</div>
      <div class="two-col">
        ${group.rows.filter((row) => row.value && row.value !== '—').map((row) => `<div class="kv"><span>${escapeHtml(row.label)}</span><strong>${dash(row.value)}</strong></div>`).join('')}
      </div>
    </div>`).join('')

  const tablesHtml = (tables ?? [])
    .filter((table) => table.rows.length)
    .map((table) => `
    <div class="section">
      <div class="section-title">${escapeHtml(table.title)}</div>
      <table>
        <thead><tr>${table.head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
        <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${dash(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`).join('')

  const body = `
  ${headerHtml(company, documentLabel, recordId, badge)}

  <div class="section">
    <div class="section-title">${escapeHtml(title)}</div>
  </div>

  ${groupsHtml}
  ${tablesHtml}

  ${notes ? `<div class="section"><div class="section-title">Observações</div><div class="text-block">${escapeHtml(notes)}</div></div>` : ''}

  ${withSignature ? signatureHtml(company.responsavelTecnico || company.nomeEmpresa, company.registroTecnico || 'Responsável Técnico') : ''}

  ${footerHtml(company, `${documentLabel}${recordId ? ` ${recordId}` : ''}`)}`

  openPrintWindow(`${documentLabel} ${recordId ?? ''}`.trim(), body)
}
