// ─── Domínio: Projetos ───────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'completed'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color: string
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  _count?: { tasks: number }
}

export interface CreateProjectDTO {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectDTO {
  name?: string
  description?: string
  status?: ProjectStatus
  color?: string
}

// ─── Domínio: Tarefas ────────────────────────────────────────────────────────

export type TaskStatus   = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low'  | 'medium'       | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  projectId: string
  project?: Pick<Project, 'id' | 'name' | 'color'>
}

export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  projectId: string
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  pendingTasks: number
  completedTasks: number
  inProgressTasks: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  message: string
  errors?: Array<{ msg: string; path: string }>
}
