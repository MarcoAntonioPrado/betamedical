import { APP_MODULES, type Role, type RoleAccessConfig } from '@atlasmed/shared'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { SearchField } from '../components/SearchField'
import { StatusPill } from '../components/StatusPill'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { useAppData } from '../contexts/AppDataContext'
import { useAuth } from '../contexts/AuthContext'
import { useUi } from '../contexts/UiContext'
import { useModuleViewMode } from '../hooks/useModuleViewMode'

const roles: Role[] = ['admin', 'gerente', 'tecnico', 'operador']

export function UsersModule() {
  const { permissions, refreshBootstrap } = useAuth()
  const { collections, ensureCollections, createUser, deleteRecord, saveRecord, resolveLabel } = useAppData()
  const { showNotice } = useUi()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', role: 'tecnico' as Role, password: '', staffId: '' })
  const [permissionMap, setPermissionMap] = useState<RoleAccessConfig>(permissions)
  const { viewMode, setViewMode } = useModuleViewMode('usuarios')

  useEffect(() => {
    void ensureCollections(['users', 'funcionarios', 'configuracoes'])
  }, [ensureCollections])

  useEffect(() => {
    setPermissionMap(permissions)
  }, [permissions])

  const users = collections.users ?? []
  const config = useMemo(() => (collections.configuracoes ?? []).find((item) => item.id === 'role-access'), [collections.configuracoes])
  const filteredUsers = useMemo(
    () => users.filter((user) => !search || `${user.nome} ${user.email} ${user.role} ${resolveLabel('funcionarios', user.staffId ?? '', 'nome')}`.toLowerCase().includes(search.toLowerCase())),
    [resolveLabel, search, users],
  )

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createUser(form)
      showNotice({ tone: 'success', title: 'Conta criada', message: 'O acesso foi provisionado com sucesso.' })
      setOpen(false)
      setForm({ nome: '', email: '', role: 'tecnico', password: '', staffId: '' })
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao criar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleSavePermissions() {
    try {
      await saveRecord('configuracoes', {
        id: 'role-access',
        nome: 'Permissões por papel',
        descricao: 'Matriz de módulos por perfil de acesso.',
        valor: permissionMap as unknown as Record<string, unknown>,
      })
      await refreshBootstrap()
      showNotice({ tone: 'success', title: 'Permissões salvas', message: 'A matriz de acesso foi atualizada.' })
    } catch (error) {
      showNotice({ tone: 'error', title: 'Falha ao salvar', message: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  return (
    <section className="module-card">
      <div className="module-heading module-toolbar">
        <div className="module-toolbar-actions">
          <SearchField value={search} onChange={setSearch} placeholder="Pesquisar por nome, email ou papel..." total={filteredUsers.length} />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button className="primary-button" type="button" onClick={() => setOpen(true)}>
            Nova conta
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? <div className="empty-state">Nenhuma conta encontrada.</div> : null}

      {filteredUsers.length > 0 && viewMode === 'list' ? (
        <div className="table-shell user-grid">
          <div className="table-head user-row">
            <span>Nome</span>
            <span>Email</span>
            <span>Papel</span>
            <span>Vínculo</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {filteredUsers.map((user) => (
            <div key={user.id} className="table-row user-row">
              <span>{user.nome}</span>
              <span>{user.email}</span>
              <span>{user.role}</span>
              <span>{resolveLabel('funcionarios', user.staffId ?? '', 'nome')}</span>
              <StatusPill label={user.ativo ? 'Ativo' : 'Inativo'} />
              <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('users', user.id)}>
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {filteredUsers.length > 0 && viewMode === 'grid' ? (
        <div className="record-grid">
          {filteredUsers.map((user) => (
            <article key={user.id} className="record-card">
              <div className="record-card-head">
                <div>
                  <p className="record-kicker">Acesso</p>
                  <h3>{user.nome}</h3>
                  <p className="record-support">{user.email}</p>
                </div>
                <StatusPill label={user.ativo ? 'Ativo' : 'Inativo'} />
              </div>
              <div className="record-card-grid">
                <div className="record-stat">
                  <span>Papel</span>
                  <strong>{user.role}</strong>
                </div>
                <div className="record-stat">
                  <span>Vínculo</span>
                  <strong>{resolveLabel('funcionarios', user.staffId ?? '', 'nome')}</strong>
                </div>
              </div>
              <div className="record-card-actions">
                <button className="ghost-button danger" type="button" onClick={() => void deleteRecord('users', user.id)}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <section className="subpanel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Permissões</p>
            <h3>Matriz de módulos</h3>
          </div>
          <button className="primary-button" type="button" onClick={() => void handleSavePermissions()}>
            Salvar permissões
          </button>
        </div>
        <div className="permission-grid">
          <div className="permission-head">Módulo</div>
          {roles.map((role) => <div key={role} className="permission-head">{role}</div>)}
          {APP_MODULES.map((module) => (
            <Fragment key={module.id}>
              <div key={`${module.id}-label`} className="permission-label">{module.label}</div>
              {roles.map((role) => (
                <label key={`${module.id}-${role}`} className="permission-cell">
                  <input
                    checked={permissionMap[role]?.includes(module.id) ?? false}
                    type="checkbox"
                    onChange={(event) => setPermissionMap((current) => ({
                      ...current,
                      [role]: event.target.checked
                        ? [...new Set([...(current[role] ?? []), module.id])]
                        : (current[role] ?? []).filter((item) => item !== module.id),
                    }))}
                  />
                </label>
              ))}
            </Fragment>
          ))}
        </div>
        {config ? <p className="muted-text">Configuração atual sincronizada do backend.</p> : null}
      </section>

      <Modal open={open} title="Nova conta" onClose={() => setOpen(false)}>
        <form className="editor-form" onSubmit={handleCreateUser}>
          <div className="field-grid">
            <label className="field-group">
              <span>Nome</span>
              <input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Papel</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Funcionário vinculado</span>
              <select value={form.staffId} onChange={(event) => setForm((current) => ({ ...current, staffId: event.target.value }))}>
                <option value="">Selecione</option>
                {(collections.funcionarios ?? []).map((staff) => <option key={staff.id} value={staff.id}>{staff.nome}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span>Senha inicial</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button" type="submit">Criar conta</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}