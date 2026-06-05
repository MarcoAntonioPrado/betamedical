import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAppData } from '../contexts/AppDataContext'
import { useUi } from '../contexts/UiContext'

export function SettingsModule() {
  const { collections, ensureCollections, saveRecord } = useAppData()
  const { showNotice } = useUi()
  const [form, setForm] = useState({ nomeEmpresa: '', tagline: '', cnpj: '', cidadeBase: '', telefone: '', email: '', site: '', endereco: '', responsavelTecnico: '', registroTecnico: '' })

  useEffect(() => {
    void ensureCollections(['configuracoes'])
  }, [ensureCollections])

  const companyProfile = useMemo(() => (collections.configuracoes ?? []).find((item) => item.id === 'company-profile'), [collections.configuracoes])

  useEffect(() => {
    const value = (companyProfile?.valor as Record<string, string> | undefined) ?? {}
    setForm({
      nomeEmpresa: value.nomeEmpresa ?? 'AtlasMed Beta',
      tagline: value.tagline ?? '',
      cnpj: value.cnpj ?? '',
      cidadeBase: value.cidadeBase ?? '',
      telefone: value.telefone ?? '',
      email: value.email ?? '',
      site: value.site ?? '',
      endereco: value.endereco ?? '',
      responsavelTecnico: value.responsavelTecnico ?? '',
      registroTecnico: value.registroTecnico ?? '',
    })
  }, [companyProfile])

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveRecord('configuracoes', {
        id: 'company-profile',
        nome: 'Perfil operacional',
        descricao: 'Dados institucionais neutros usados no beta.',
        valor: form,
      })
      showNotice({ tone: 'success', title: 'Configurações salvas', message: 'O perfil operacional foi atualizado.' })
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  return (
    <section className="module-card">
      <div className="split-grid settings-layout">
        <form className="editor-form panel-block" onSubmit={handleSave}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Perfil operacional</p>
              <h3>Identidade</h3>
            </div>
          </div>
          <div className="field-grid">
            <label className="field-group">
              <span>Nome da operação</span>
              <input value={form.nomeEmpresa} onChange={(event) => setForm((current) => ({ ...current, nomeEmpresa: event.target.value }))} />
            </label>
            <label className="field-group full">
              <span>Tagline</span>
              <input value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>CNPJ</span>
              <input value={form.cnpj} onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Cidade base</span>
              <input value={form.cidadeBase} onChange={(event) => setForm((current) => ({ ...current, cidadeBase: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Telefone</span>
              <input value={form.telefone} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Site</span>
              <input value={form.site} onChange={(event) => setForm((current) => ({ ...current, site: event.target.value }))} />
            </label>
            <label className="field-group full">
              <span>Endereço</span>
              <input value={form.endereco} onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Responsável técnico</span>
              <input value={form.responsavelTecnico} onChange={(event) => setForm((current) => ({ ...current, responsavelTecnico: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Registro do responsável (CREA/ART)</span>
              <input value={form.registroTecnico} onChange={(event) => setForm((current) => ({ ...current, registroTecnico: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="primary-button" type="submit">Salvar perfil</button>
          </div>
        </form>

        <section className="panel-block deployment-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Deploy</p>
              <h3>Variáveis de ambiente</h3>
            </div>
          </div>
          <div className="placeholder-grid">
            <article>
              <strong>Backend no Render</strong>
              <span>`APP_MODE`, `PORT`, `FRONTEND_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`</span>
            </article>
            <article>
              <strong>Frontend na Vercel</strong>
              <span>`VITE_API_URL`, `VITE_APP_MODE`, `VITE_FIREBASE_*`</span>
            </article>
            <article>
              <strong>API atual</strong>
              <span>{api.baseUrl}</span>
            </article>
          </div>
        </section>
      </div>
    </section>
  )
}