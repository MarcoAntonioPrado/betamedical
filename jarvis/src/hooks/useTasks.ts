import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import { eventBus, AppEvents } from '@/lib/eventBus'
import { useAppStore } from '@/store/useAppStore'
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types'

export function useTasks(projectId?: string) {
  const {
    tasks,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
  } = useAppStore()

  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = projectId
        ? `/api/projects/${projectId}/tasks`
        : '/api/tasks'
      const data = await api.get<Task[]>(endpoint)
      setTasks(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao buscar tarefas')
    } finally {
      setLoading(false)
    }
  }, [projectId, setTasks, setLoading])

  const createTask = useCallback(
    async (dto: CreateTaskDTO): Promise<Task | null> => {
      try {
        const task = await api.post<Task>('/api/tasks', dto)
        addTask(task)
        eventBus.emit(AppEvents.TASK_CREATED, task)
        return task
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao criar tarefa')
        return null
      }
    },
    [addTask],
  )

  const editTask = useCallback(
    async (id: string, dto: UpdateTaskDTO): Promise<boolean> => {
      try {
        const task = await api.patch<Task>(`/api/tasks/${id}`, dto)
        updateTask(id, task)
        eventBus.emit(AppEvents.TASK_UPDATED, task)
        return true
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao atualizar tarefa')
        return false
      }
    },
    [updateTask],
  )

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.delete(`/api/tasks/${id}`)
        removeTask(id)
        eventBus.emit(AppEvents.TASK_DELETED, { id })
        return true
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao excluir tarefa')
        return false
      }
    },
    [removeTask],
  )

  // Re-fetch quando o projectId muda
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, error, fetchTasks, createTask, editTask, deleteTask }
}
