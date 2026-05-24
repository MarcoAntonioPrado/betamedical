import { APP_MODULES, ENTITY_CONFIGS, type ModuleId } from '@atlasmed/shared'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { LoginView } from './components/LoginView'
import { ThemeToggle } from './components/ThemeToggle'
import { ToastHost } from './components/ToastHost'
import { useAuth } from './contexts/AuthContext'
import { BudgetModule } from './modules/BudgetModule'
import { CertificatesModule } from './modules/CertificatesModule'
import { DashboardModule } from './modules/DashboardModule'
import { EntityModule } from './modules/EntityModule'
import { FinanceModule } from './modules/FinanceModule'
import { HistoryModule } from './modules/HistoryModule'
import { InventoryModule } from './modules/InventoryModule'
import { SettingsModule } from './modules/SettingsModule'
import { ServiceOrdersModule } from './modules/ServiceOrdersModule'
import { UsersModule } from './modules/UsersModule'

export default function App() {
  const { ready, loading, user, permissions, bootstrap, logout } = useAuth()
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard')

  const allowedModules = useMemo(() => {
    if (!user) return []
    const allowedIds = permissions[user.role] ?? []
    return APP_MODULES.filter((module) => allowedIds.includes(module.id))
  }, [permissions, user])

  useEffect(() => {
    if (!allowedModules.length) return
    if (!allowedModules.some((module) => module.id === activeModule)) {
      setActiveModule(allowedModules[0].id)
    }
  }, [activeModule, allowedModules])

  if (!ready || (loading && !user)) {
    return <div className="splash-screen">Preparando ambiente...</div>
  }

  if (!user) {
    return (
      <>
        <LoginView />
        <ToastHost />
      </>
    )
  }

  const activeDefinition = allowedModules.find((module) => module.id === activeModule) ?? allowedModules[0]
  const activePosition = Math.max(allowedModules.findIndex((module) => module.id === activeDefinition.id), 0) + 1
  const companyName = String(bootstrap.companyProfile.nomeEmpresa ?? 'AtlasMed Beta')
  const companyTagline = String(bootstrap.companyProfile.tagline ?? 'Gestão moderna para engenharia clínica.')
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  function renderModule(moduleId: ModuleId) {
    switch (moduleId) {
      case 'dashboard':
        return <DashboardModule />
      case 'financeiro':
        return <FinanceModule />
      case 'ordens-servico':
        return <ServiceOrdersModule />
      case 'historico-os':
        return <HistoryModule />
      case 'orcamentos':
        return <BudgetModule />
      case 'pecas':
        return <InventoryModule config={ENTITY_CONFIGS.pecas} />
      case 'acessorios':
        return <InventoryModule config={ENTITY_CONFIGS.acessorios} />
      case 'clientes':
        return <EntityModule config={ENTITY_CONFIGS.clientes} />
      case 'equipamentos':
        return <EntityModule config={ENTITY_CONFIGS.equipamentos} />
      case 'funcionarios':
        return <EntityModule config={ENTITY_CONFIGS.funcionarios} />
      case 'fornecedores':
        return <EntityModule config={ENTITY_CONFIGS.fornecedores} />
      case 'contratos':
        return <EntityModule config={ENTITY_CONFIGS.contratos} />
      case 'padroes-calibracao':
        return <EntityModule config={ENTITY_CONFIGS.padroesCalibracao} />
      case 'certificados':
        return <CertificatesModule />
      case 'usuarios':
        return <UsersModule />
      case 'configuracoes':
        return <SettingsModule />
      default:
        return (
          <section className="module-card">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Em ajuste</p>
                <h2>{activeDefinition.label}</h2>
                <p className="muted-text">Este módulo entra na próxima rodada da refatoração.</p>
              </div>
            </div>
          </section>
        )
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar-shell">
        <div className="brand-block">
          <span className="brand-kicker">beta</span>
          <h1>{companyName}</h1>
        </div>
        <div className="rail-stats">
          <article className="signal-chip">
            <span>perfil</span>
            <strong>{user.role}</strong>
          </article>
          <article className="signal-chip">
            <span>módulos</span>
            <strong>{allowedModules.length}</strong>
          </article>
        </div>
        <nav className="nav-stack">
          {allowedModules.map((module, index) => (
            <button
              key={module.id}
              type="button"
              className={module.id === activeDefinition.id ? 'nav-item active' : 'nav-item'}
              onClick={() => startTransition(() => setActiveModule(module.id))}
            >
              <span className="nav-order">{String(index + 1).padStart(2, '0')}</span>
              <span className="nav-copy">
                <strong>{module.shortLabel}</strong>
                <small>{module.label}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="identity-block">
            <strong>{user.name}</strong>
            <span className="identity-email">{user.role} · {user.email}</span>
          </div>
          <button className="ghost-button" type="button" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </aside>
      <main className="workspace-shell">
        <header className="topbar-shell">
          <div className="topbar-copy">
            <div className="title-lockup">
              <span className="module-index">{String(activePosition).padStart(2, '0')}</span>
              <div>
                <h2>{activeDefinition.label}</h2>
                <p className="muted-text">{activeDefinition.description}</p>
              </div>
            </div>
            <div className="topbar-meta">
              <span className="meta-pill">{user.mode === 'demo' ? 'Demo' : 'Live'}</span>
              <span className="meta-pill">{todayLabel}</span>
            </div>
          </div>
          <div className="topbar-tools">
            <ThemeToggle compact />
          </div>
        </header>
        {renderModule(activeDefinition.id)}
      </main>
      <ToastHost />
    </div>
  )
}