import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import { eventBus, AppEvents } from '@/lib/eventBus'
import { useAppStore } from '@/store/useAppStore'
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types'

export function useProjects() {
  const {
    projects,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    setLoading,
  } = useAppStore()

  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<Project[]>('/api/projects')
      setProjects(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao buscar projetos')
    } finally {
      setLoading(false)
    }
  }, [setProjects, setLoading])

  const createProject = useCallback(
    async (dto: CreateProjectDTO): Promise<Project | null> => {
      try {
        const project = await api.post<Project>('/api/projects', dto)
        addProject(project)
        eventBus.emit(AppEvents.PROJECT_CREATED, project)
        return project
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao criar projeto')
        return null
      }
    },
    [addProject],
  )

  const editProject = useCallback(
    async (id: string, dto: UpdateProjectDTO): Promise<boolean> => {
      try {
        const project = await api.put<Project>(`/api/projects/${id}`, dto)
        updateProject(id, project)
        eventBus.emit(AppEvents.PROJECT_UPDATED, project)
        return true
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao atualizar projeto')
        return false
      }
    },
    [updateProject],
  )

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.delete(`/api/projects/${id}`)
        removeProject(id)
        eventBus.emit(AppEvents.PROJECT_DELETED, { id })
        return true
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao excluir projeto')
        return false
      }
    },
    [removeProject],
  )

  // Carrega projetos na montagem
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, error, fetchProjects, createProject, editProject, deleteProject }
}
