import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, Task } from '@/types'

interface AppState {
  // ─── Navegação ───────────────────────────────────────────────────────────
  selectedProjectId: string | null
  sidebarOpen: boolean

  // ─── Loading global ──────────────────────────────────────────────────────
  isLoading: boolean

  // ─── Cache de dados ──────────────────────────────────────────────────────
  projects: Project[]
  tasks: Task[]

  // ─── Actions: navegação ──────────────────────────────────────────────────
  setSelectedProject: (id: string | null) => void
  toggleSidebar: () => void
  setLoading: (v: boolean) => void

  // ─── Actions: projetos ───────────────────────────────────────────────────
  setProjects:   (projects: Project[]) => void
  addProject:    (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void

  // ─── Actions: tarefas ────────────────────────────────────────────────────
  setTasks:   (tasks: Task[]) => void
  addTask:    (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      selectedProjectId: null,
      sidebarOpen: true,
      isLoading: false,
      projects: [],
      tasks: [],

      setSelectedProject: (id) => set({ selectedProjectId: id }),
      toggleSidebar:      ()   => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLoading:         (v)  => set({ isLoading: v }),

      setProjects:   (projects) => set({ projects }),
      addProject:    (project)  => set((s) => ({ projects: [...s.projects, project] })),
      updateProject: (id, u)    => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...u } : p)),
      })),
      removeProject: (id)       => set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
      })),

      setTasks:   (tasks) => set({ tasks }),
      addTask:    (task)  => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, u) => set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...u } : t)),
      })),
      removeTask: (id)    => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      })),
    }),
    { name: 'DevAssistantStore' },
  ),
)
