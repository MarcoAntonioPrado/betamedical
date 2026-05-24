import { demoAccounts } from '@atlasmed/shared'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'

export function LoginView() {
  const { mode, login, loading } = useAuth()
  const { showNotice } = useUi()
  const [email, setEmail] = useState(demoAccounts[0]?.email ?? '')
  const [password, setPassword] = useState(demoAccounts[0]?.password ?? '')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await login(email, password)
      showNotice({ tone: 'success', title: 'Sessão iniciada', message: 'Ambiente beta carregado com sucesso.' })
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha no login', message: error instanceof Error ? error.message : 'Não foi possível autenticar.' })
    }
  }

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="login-hero-bar">
          <span className="login-chip">Workspace beta</span>
        </div>
        <p className="eyebrow">AtlasMed · Beta</p>
        <h1>Gestão de equipamentos médicos</h1>
        <p>Manutenção, calibração e rastreabilidade técnica em uma plataforma unificada.</p>
        <div className="hero-grid">
          <article>
            <strong>Manutenção</strong>
            <span>Ordens de serviço, histórico técnico e status em tempo real.</span>
          </article>
          <article>
            <strong>Rastreabilidade</strong>
            <span>Certificados, padrões de calibração e registros auditáveis.</span>
          </article>
          <article>
            <strong>Comercial</strong>
            <span>Contratos ativos, orçamentos e controle financeiro integrado.</span>
          </article>
        </div>
        <div className="hero-band">
          <span>ordens de serviço</span>
          <span>estoque</span>
          <span>financeiro</span>
          <span>rastreabilidade</span>
        </div>
      </div>
      <div className="login-card">
        <div className="login-card-topbar">
          <div className="login-card-header">
            <p className="eyebrow">Acesso</p>
            <h2>Entrar</h2>
            <p className="muted-text">Insira suas credenciais para acessar o painel.</p>
          </div>
          <div className="login-card-badge">Painel operacional</div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@empresa.com" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar painel'}
          </button>
        </form>
        <div className="login-assurance-grid">
          <article>
            <strong>Exploração guiada</strong>
            <span>Perfis com permissões e dados prontos para navegação.</span>
          </article>
          <article>
            <strong>Operação demo</strong>
            <span>Fluxos técnicos e comerciais conectados no mesmo ambiente.</span>
          </article>
        </div>
        <div className="login-mode-pill">{mode === 'demo' ? 'Modo demo local' : 'Modo Firebase'}</div>
        <div className="demo-hints-header">
          <p className="eyebrow">Acessos rápidos</p>
          <p className="muted-text">Escolha um perfil para preencher o formulário automaticamente.</p>
        </div>
        <div className="demo-hints">
          {demoAccounts.map(({ email: accountEmail, password: accountPassword, user }) => (
            <button
              key={accountEmail}
              type="button"
              className="hint-card"
              onClick={() => {
                setEmail(accountEmail)
                setPassword(accountPassword)
              }}
            >
              <strong>{user.name}</strong>
              <span>{user.role}</span>
              <small>{accountEmail}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}