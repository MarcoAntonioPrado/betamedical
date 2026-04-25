import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight, FolderKanban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useProjects } from '@/hooks/useProjects'
import type { CreateProjectDTO, Project } from '@/types'

const PROJECT_COLORS = [
  '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899',
]

// â”€â”€â”€ FormulÃ¡rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ProjectFormProps {
  initial?: Partial<Project>
  onSubmit: (data: CreateProjectDTO) => void
  onCancel: () => void
  loading?: boolean
}

function ProjectForm({ initial, onSubmit, onCancel, loading }: ProjectFormProps) {
  const [name, setName]               = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor]             = useState(initial?.color ?? PROJECT_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined, color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do projeto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Meu Projeto"
        required
        autoFocus
      />
      <Textarea
        label="DescriÃ§Ã£o (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Sobre o projeto..."
        rows={3}
      />
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.1em] mb-2">Cor</p>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-all duration-150 ${
                color === c
                  ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-hud-surface scale-110'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

// â”€â”€â”€ PÃ¡gina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Projects() {
  const navigate = useNavigate()
  const { projects, createProject, editProject, deleteProject } = useProjects()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Project | null>(null)
  const [saving, setSaving]         = useState(false)

  const handleCreate = async (data: CreateProjectDTO) => {
    setSaving(true)
    const project = await createProject(data)
    setSaving(false)
    if (project) setShowCreate(false)
  }

  const handleEdit = async (data: CreateProjectDTO) => {
    if (!editing) return
    setSaving(true)
    const ok = await editProject(editing.id, data)
    setSaving(false)
    if (ok) setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este projeto? Todas as tarefas serÃ£o removidas.')) return
    await deleteProject(id)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* â”€â”€â”€ Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-600 border border-hud-border px-1.5 py-0.5 rounded tracking-widest">
            PRJ
          </span>
          <p className="text-xs text-slate-500 font-mono">{projects.length} projeto(s)</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> Novo Projeto
        </Button>
      </div>

      {/* â”€â”€â”€ Empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {projects.length === 0 ? (
        <div className="bg-hud-surface border border-hud-border rounded-lg p-16 text-center animate-fade-in">
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
          >
            <FolderKanban size={22} className="text-slate-600" />
          </div>
          <p className="text-sm text-slate-500 mb-4">Nenhum projeto criado ainda</p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus size={13} /> Criar primeiro projeto
          </Button>
        </div>
      ) : (
        /* â”€â”€â”€ Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-default p-4"
            >
              {/* Top: color dot + name + actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: project.color,
                      boxShadow: `0 0 6px ${project.color}60`,
                    }}
                  />
                  <h3 className="font-medium text-slate-200 text-sm truncate">{project.name}</h3>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                  <button
                    onClick={() => setEditing(project)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-hud-border/60">
                <Badge
                  variant={
                    project.status === 'active'    ? 'success' :
                    project.status === 'completed' ? 'info'    : 'default'
                  }
                >
                  {project.status === 'active' ? 'ativo' : project.status === 'completed' ? 'concluÃ­do' : 'pausado'}
                </Badge>
                <button
                  onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  className="flex items-center gap-1 text-[11px] text-sky-500 hover:text-sky-400 transition-colors"
                >
                  Tarefas <ChevronRight size={11} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* â”€â”€â”€ Modais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto">
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Projeto">
        {editing && (
          <ProjectForm
            initial={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  )
}
