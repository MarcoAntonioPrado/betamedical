import { prisma } from '../db/prisma'
import { serverEventBus, ServerEvents } from '../events/EventBus'
import type { Project } from '@prisma/client'

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: string
  color?: string
}

export class ProjectService {
  /** Lista todos os projetos com contagem de tarefas. */
  async findAll(limit?: number) {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { _count: { select: { tasks: true } } },
    })
  }

  /** Retorna projeto com tarefas aninhadas. */
  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        _count: { select: { tasks: true } },
      },
    })
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name:        input.name,
        description: input.description,
        color:       input.color ?? '#6366f1',
      },
    })
    serverEventBus.publish(ServerEvents.PROJECT_CREATED, project)
    return project
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data:  input,
    })
    serverEventBus.publish(ServerEvents.PROJECT_UPDATED, project)
    return project
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } })
    serverEventBus.publish(ServerEvents.PROJECT_DELETED, { id })
  }

  /** Estatísticas agregadas para o Dashboard. */
  async getStats() {
    const [
      totalProjects,
      activeProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      inProgressTasks,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'active' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'todo' } }),
      prisma.task.count({ where: { status: 'done' } }),
      prisma.task.count({ where: { status: 'in_progress' } }),
    ])

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      inProgressTasks,
    }
  }
}

export const projectService = new ProjectService()
