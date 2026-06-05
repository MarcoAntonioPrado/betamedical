import type { Certificado, Equipamento, PadraoCalibracao } from '@atlasmed/shared'
import { TIPO_CERTIFICADO_LABELS } from '@atlasmed/shared'
import type { CompanyProfile } from '../lib/pdf'

interface PrintCertificateOptions {
  cert: Certificado
  equipment?: Equipamento
  padrao?: PadraoCalibracao
  company?: CompanyProfile
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function buildCertificateHtml(opts: PrintCertificateOptions): string {
  const { cert, equipment, padrao, company } = opts
  const companyName = company?.nomeEmpresa ?? 'AtlasMed Engenharia Clínica'
  const companyTagline = company?.tagline ?? 'Engenharia Clínica · Gestão de Equipamentos Médicos'
  const companyMetaParts: string[] = []
  if (company?.cnpj) companyMetaParts.push(`CNPJ: ${company.cnpj}`)
  const localParts = [company?.endereco, company?.cidadeBase].filter(Boolean)
  if (localParts.length) companyMetaParts.push(localParts.join(' · '))
  const contactParts = [company?.telefone, company?.email, company?.site].filter(Boolean)
  if (contactParts.length) companyMetaParts.push(contactParts.join(' · '))
  const companyMeta = companyMetaParts.join('<br>')
  const tipoLabel = TIPO_CERTIFICADO_LABELS[cert.tipo] ?? cert.tipo
  const statusColor = cert.statusGeral === 'aprovado' ? '#16a34a' : cert.statusGeral === 'reprovado' ? '#dc2626' : '#d97706'
  const statusLabel = cert.statusGeral === 'aprovado' ? 'APROVADO' : cert.statusGeral === 'reprovado' ? 'REPROVADO' : 'EM ANDAMENTO'

  const hasMedicoes = cert.medicoes && cert.medicoes.length > 0
  const hasSeguranca = !!cert.segurancaEletrica
  const hasCondicoes = !!cert.condicoesAmbientais

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Certificado ${cert.numeroCertificado ?? cert.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; background: white; }
  @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
  .page { max-width: 210mm; margin: 0 auto; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 12px; }
  .company-name { font-size: 15pt; font-weight: bold; color: #1e40af; }
  .company-sub { font-size: 9pt; color: #555; }
  .company-meta { font-size: 7.8pt; color: #666; margin-top: 5px; line-height: 1.5; }
  .cert-title { text-align: right; }
  .cert-title h1 { font-size: 12pt; font-weight: bold; color: #1e40af; }
  .cert-title .cert-num { font-size: 9pt; color: #555; margin-top: 3px; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-weight: bold; font-size: 10pt; color: white; background-color: ${statusColor}; margin-top: 6px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th { background: #eff6ff; text-align: left; padding: 4px 6px; font-weight: bold; border: 1px solid #ddd; }
  td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .kv { margin-bottom: 4px; }
  .kv span { font-size: 8pt; color: #666; display: block; }
  .kv strong { font-size: 9.5pt; }
  .footer { margin-top: 18px; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8pt; color: #777; }
  .sig-block { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 8pt; color: #444; }
  .result-box { text-align: center; padding: 10px; border: 2px solid ${statusColor}; border-radius: 6px; margin-top: 10px; }
  .result-box .result-text { font-size: 14pt; font-weight: bold; color: ${statusColor}; }
  .result-box .result-sub { font-size: 8pt; color: #666; margin-top: 3px; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="company-sub">${companyTagline}</div>
      ${companyMeta ? `<div class="company-meta">${companyMeta}</div>` : ''}
    </div>
    <div class="cert-title">
      <h1>CERTIFICADO — ${tipoLabel.toUpperCase()}</h1>
      <div class="cert-num">Nº ${cert.numeroCertificado ?? cert.id}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">Dados do Equipamento</div>
      <div class="kv"><span>Equipamento</span><strong>${cert.equipamentoNome}</strong></div>
      ${equipment?.fabricante ? `<div class="kv"><span>Fabricante</span><strong>${equipment.fabricante}</strong></div>` : ''}
      ${equipment?.modelo ? `<div class="kv"><span>Modelo</span><strong>${equipment.modelo}</strong></div>` : ''}
      <div class="kv"><span>Nº de Série</span><strong>${cert.equipamentoNumeroSerie}</strong></div>
      ${cert.equipamentoTag ? `<div class="kv"><span>TAG</span><strong>${cert.equipamentoTag}</strong></div>` : ''}
      ${cert.equipamentoPatrimonio ? `<div class="kv"><span>Patrimônio</span><strong>${cert.equipamentoPatrimonio}</strong></div>` : ''}
      ${equipment?.setor ? `<div class="kv"><span>Setor</span><strong>${equipment.setor}</strong></div>` : ''}
      ${equipment?.local ? `<div class="kv"><span>Local</span><strong>${equipment.local}</strong></div>` : ''}
      ${equipment?.classeEquipamento ? `<div class="kv"><span>Classe Elétrica</span><strong>${equipment.classeEquipamento}</strong></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Dados da Certificação</div>
      ${cert.clienteNome ? `<div class="kv"><span>Cliente / Hospital</span><strong>${cert.clienteNome}</strong></div>` : ''}
      <div class="kv"><span>Tipo de Certificado</span><strong>${tipoLabel}</strong></div>
      <div class="kv"><span>Data da Emissão</span><strong>${formatDate(cert.data)}</strong></div>
      ${cert.proximaData ? `<div class="kv"><span>Próxima Data</span><strong>${formatDate(cert.proximaData)}</strong></div>` : ''}
      <div class="kv"><span>Técnico Responsável</span><strong>${cert.tecnicoNome}</strong></div>
      ${cert.tecnicoRegistro ? `<div class="kv"><span>Registro Profissional</span><strong>${cert.tecnicoRegistro}</strong></div>` : ''}
      ${padrao ? `<div class="kv"><span>Padrão Utilizado</span><strong>${padrao.nome} — Nº ${padrao.numeroSerie}</strong></div>` : ''}
      ${padrao?.validadeCalibracao ? `<div class="kv"><span>Validade do Padrão</span><strong>${formatDate(padrao.validadeCalibracao)}</strong></div>` : ''}
    </div>
  </div>

  ${hasCondicoes ? `
  <div class="section">
    <div class="section-title">Condições Ambientais no Momento do Ensaio</div>
    <div class="three-col">
      ${cert.condicoesAmbientais?.temperatura ? `<div class="kv"><span>Temperatura</span><strong>${cert.condicoesAmbientais.temperatura}</strong></div>` : ''}
      ${cert.condicoesAmbientais?.umidade ? `<div class="kv"><span>Umidade Relativa</span><strong>${cert.condicoesAmbientais.umidade}</strong></div>` : ''}
      ${cert.condicoesAmbientais?.pressao ? `<div class="kv"><span>Pressão</span><strong>${cert.condicoesAmbientais.pressao}</strong></div>` : ''}
      ${cert.condicoesAmbientais?.tensaoRede ? `<div class="kv"><span>Tensão de Rede</span><strong>${cert.condicoesAmbientais.tensaoRede}</strong></div>` : ''}
    </div>
  </div>` : ''}

  ${hasMedicoes ? `
  <div class="section">
    <div class="section-title">Resultados das Medições</div>
    <table>
      <thead>
        <tr>
          <th>Ponto Nominal</th>
          <th>Valor Medido</th>
          <th>Erro Encontrado</th>
          <th>Incerteza</th>
          <th>Tolerância</th>
          <th>Resultado</th>
        </tr>
      </thead>
      <tbody>
        ${cert.medicoes!.map((m) => `
        <tr>
          <td>${m.pontoNominal}</td>
          <td>${m.valorMedido}</td>
          <td>${m.erroEncontrado ?? '—'}</td>
          <td>${m.incerteza ?? '—'}</td>
          <td>${m.tolerancia ?? '—'}</td>
          <td style="font-weight:bold;color:${m.resultado === 'Conforme' ? '#16a34a' : '#dc2626'}">${m.resultado}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${hasSeguranca ? `
  <div class="section">
    <div class="section-title">Resultados de Segurança Elétrica (ABNT NBR IEC 60601-1)</div>
    <table>
      <thead>
        <tr><th>Parâmetro</th><th>Valor Medido</th><th>Limite</th></tr>
      </thead>
      <tbody>
        ${cert.segurancaEletrica!.correnteFugaTerra ? `<tr><td>Corrente de Fuga à Terra</td><td>${cert.segurancaEletrica!.correnteFugaTerra}</td><td>${cert.segurancaEletrica!.limiteCorrenteFuga ?? '—'}</td></tr>` : ''}
        ${cert.segurancaEletrica!.correnteFugaInvolucro ? `<tr><td>Corrente de Fuga no Invólucro</td><td>${cert.segurancaEletrica!.correnteFugaInvolucro}</td><td>—</td></tr>` : ''}
        ${cert.segurancaEletrica!.correnteFugaPaciente ? `<tr><td>Corrente de Fuga no Paciente</td><td>${cert.segurancaEletrica!.correnteFugaPaciente}</td><td>—</td></tr>` : ''}
        ${cert.segurancaEletrica!.resistenciaTerra ? `<tr><td>Resistência de Aterramento</td><td>${cert.segurancaEletrica!.resistenciaTerra}</td><td>${cert.segurancaEletrica!.limiteResistenciaTerra ?? '—'}</td></tr>` : ''}
        ${cert.segurancaEletrica!.tensaoAplicada ? `<tr><td>Tensão Aplicada (Rigidez Dielétrica)</td><td>${cert.segurancaEletrica!.tensaoAplicada}</td><td>—</td></tr>` : ''}
        ${cert.segurancaEletrica!.isolacao ? `<tr><td>Resistência de Isolação</td><td>${cert.segurancaEletrica!.isolacao}</td><td>—</td></tr>` : ''}
        <tr style="font-weight:bold;background:#f0f9ff">
          <td colspan="2">RESULTADO GERAL</td>
          <td style="color:${cert.segurancaEletrica!.resultado === 'Aprovado' ? '#16a34a' : '#dc2626'}">${cert.segurancaEletrica!.resultado}</td>
        </tr>
      </tbody>
    </table>
  </div>` : ''}

  ${cert.checklist && cert.checklist.length > 0 ? `
  <div class="section">
    <div class="section-title">Checklist Técnico</div>
    <table>
      <thead>
        <tr><th>Item Verificado</th><th>Resultado</th><th>Medição / Observação</th></tr>
      </thead>
      <tbody>
        ${cert.checklist.map((ch) => `
        <tr>
          <td>${ch.nome}</td>
          <td style="font-weight:bold;color:${ch.status === 'ok' || ch.status === 'conforme' ? '#16a34a' : '#dc2626'}">${ch.status.toUpperCase()}</td>
          <td>${ch.medicao ?? '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${cert.conclusaoTecnica ? `
  <div class="section">
    <div class="section-title">Conclusão Técnica</div>
    <p style="font-size:9pt;line-height:1.5">${cert.conclusaoTecnica}</p>
  </div>` : ''}

  ${cert.recomendacoes ? `
  <div class="section">
    <div class="section-title">Recomendações</div>
    <p style="font-size:9pt;line-height:1.5;color:#555">${cert.recomendacoes}</p>
  </div>` : ''}

  ${cert.observacoes ? `
  <div class="section">
    <div class="section-title">Observações</div>
    <p style="font-size:9pt;line-height:1.5;color:#555">${cert.observacoes}</p>
  </div>` : ''}

  <div class="result-box">
    <div class="result-text">${statusLabel}</div>
    <div class="result-sub">${tipoLabel} · ${formatDate(cert.data)}</div>
  </div>

  <div class="sig-block">
    <div>
      <div class="sig-line">
        <strong>${cert.tecnicoNome}</strong><br>
        ${cert.tecnicoRegistro ? cert.tecnicoRegistro : 'Técnico Responsável'}
      </div>
    </div>
    <div>
      <div class="sig-line">
        Aprovação / Visto<br>
        <strong>${cert.assinadoPor ?? company?.responsavelTecnico ?? '___________________________'}</strong>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Gerado por ${companyName}</span>
    <span>Cert. ${cert.numeroCertificado ?? cert.id} · Emitido em ${formatDate(cert.data)}</span>
    <span>Versão ${cert.versao ?? 1}</span>
  </div>

</div>
</body>
</html>`
}

export function usePrintCertificate() {
  return function printCertificate(opts: PrintCertificateOptions) {
    const html = buildCertificateHtml(opts)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      alert('Popup bloqueado. Permita popups neste site para gerar o PDF.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }
}
