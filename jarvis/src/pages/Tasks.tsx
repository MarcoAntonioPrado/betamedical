import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useTasks } from '@/hooks/useTasks'
import { useAppStore } from '@/store/useAppStore'
import type { CreateTaskDTO, Task, TaskPriority, TaskStatus } from '@/types'

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low:    'Baixa',
  medium: 'MÃ©dia',
  high:   'Alta',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:        'A Fazer',
  in_progress: 'Em Progresso',
  done:        'ConcluÃ­do',
}

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo:        'in_progress',
  in_progress: 'done',
  done:        'todo',
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:        'border-t-slate-700',
  in_progress: 'border-t-sky-500/50',
  done:        'border-t-emerald-500/50',
}

const STATUS_ACCENT: Record<TaskStatus, string> = {
  todo:        'text-slate-500',
  in_progress: 'text-sky-400',
  done:        'text-emerald-400',
}

// â”€â”€â”€ FormulÃ¡rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TaskFormProps {
  initial?: Partial<Task>
  projectId: string
  onSubmit: (data: CreateTaskDTO) => void
  onCancel: () => void
  loading?: boolean
}

function TaskForm({ initial, projectId, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle]             = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority]       = useState<TaskPriority>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate]         = useState(
    initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title:       title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate:     dueDate || undefined,
      projectId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="TÃ­tulo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="O que precisa ser feito?"
        required
        autoFocus
      />
      <Textarea
        label="DescriÃ§Ã£o (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Detalhes..."
        rows={3}
      />
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.1em] mb-2">
          Prioridade
        </p>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                priority === p
                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                  : 'bg-hud-alt text-slate-500 border-hud-border hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      <Input
        label="Data limite (opcional)"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
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

// â”€â”€â”€ Kanban column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

function KanbanColumn({ status, tasks, onToggle, onEdit, onDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-hud-surface border border-hud-border rounded-md"
        style={{
          borderTopWidth: '2px',
          borderTopColor:
            status === 'in_progress' ? 'rgba(14,165,233,0.5)' :
            status === 'done'        ? 'rgba(16,185,129,0.5)' : 'rgba(71,85,105,0.4)',
        }}
      >
        <h2 className={`text-[10px] font-semibold uppercase tracking-[0.12em] flex-1 ${STATUS_ACCENT[status]}`}>
          {STATUS_LABEL[status]}
        </h2>
        <span className="text-[10px] text-slate-600 font-mono bg-hud-alt border border-hud-border px-1.5 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group bg-hud-surface border border-hud-border rounded-md p-3 hover:border-slate-600/60 transition-colors duration-150 animate-fade-in"
          >
            <div className="flex items-start gap-2">
              {/* Toggle status button */}
              <button
                onClick={() => onToggle(task)}
                className="mt-0.5 flex-shrink-0 transition-colors text-slate-700 hover:text-sky-400"
                title={`Mover para ${STATUS_LABEL[STATUS_NEXT[task.status]]}`}
              >
                <CheckCircle2
                  size={15}
                  className={task.status === 'done' ? 'text-emerald-500' : ''}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-snug ${
                    task.status === 'done' ? 'line-through text-slate-600' : 'text-slate-200'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant={
                      task.priority === 'high'   ? 'danger'  :
                      task.priority === 'medium' ? 'warning' : 'default'
                    }
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions â€” appear on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
                  title="Editar"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty column placeholder */}
        {tasks.length === 0 && (
          <div className="border border-dashed border-hud-border/40 rounded-md p-4 text-center">
            <p className="text-[10px] text-slate-700 font-mono">vazio</p>
          </div>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ PÃ¡gina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Tasks() {
  const { projectId } = useParams<{ projectId?: string }>()
  const { tasks, createTask, editTask, deleteTask } = useTasks(projectId)
  const projects = useAppStore((s) => s.projects)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Task | null>(null)
  const [saving, setSaving]         = useState(false)

  const currentProject    = projectId ? projects.find((p) => p.id === projectId) : undefined
  const defaultProjectId  = projectId ?? projects[0]?.id ?? ''

  const handleCreate = async (data: CreateTaskDTO) => {
    setSaving(true)
    const task = await createTask(data)
    setSaving(false)
    if (task) setShowCreate(false)
  }

  const handleEdit = async (data: CreateTaskDTO) => {
    if (!editing) return
    setSaving(true)
    const ok = await editTask(editing.id, data)
    setSaving(false)
    if (ok) setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta tarefa?')) return
    await deleteTask(id)
  }

  const handleToggle = async (task: Task) => {
    await editTask(task.id, { status: STATUS_NEXT[task.status] })
  }

  const grouped: Record<TaskStatus, Task[]> = {
    todo:        tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done:        tasks.filter((t) => t.status === 'done'),
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* â”€â”€â”€ Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {projectId && (
            <Link
              to="/projects"
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Voltar para projetos"
            >
              <ChevronLeft size={15} />
            </Link>
          )}
          <div>
            {currentProject && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentProject.color }}
                />
                {currentProject.name}
              </p>
            )}
            <p className="text-xs text-slate-600 font-mono">{tasks.length} tarefa(s)</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreate(true)}
          disabled={!defaultProjectId}
          title={!defaultProjectId ? 'Crie um projeto primeiro' : undefined}
        >
          <Plus size={13} /> Nova Tarefa
        </Button>
      </div>

      {/* â”€â”€â”€ Kanban board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tasks.length === 0 && !defaultProjectId ? (
        <div className="bg-hud-surface border border-hud-border rounded-lg p-12 text-center animate-fade-in">
          <p className="text-sm text-slate-500 mb-3">Crie um projeto antes de adicionar tarefas.</p>
          <Link
            to="/projects"
            className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
          >
            Ir para Projetos â†’
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(grouped) as TaskStatus[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              onToggle={handleToggle}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* â”€â”€â”€ Modais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Tarefa">
        {defaultProjectId ? (
          <TaskForm
            projectId={defaultProjectId}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={saving}
          />
        ) : (
          <p className="text-sm text-slate-500">Crie um projeto primeiro.</p>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Tarefa">
        {editing && (
          <TaskForm
            initial={editing}
            projectId={editing.projectId}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  )
}
