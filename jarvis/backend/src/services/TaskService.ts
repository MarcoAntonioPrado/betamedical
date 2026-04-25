import { prisma } from '../db/prisma'
import { serverEventBus, ServerEvents } from '../events/EventBus'
import type { Task } from '@prisma/client'

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: string
  dueDate?: string
  projectId: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: string | null
}

export interface TaskFilters {
  /** Comma-separated statuses: "todo,in_progress" */
  status?: string
  projectId?: string
  limit?: number
}

export class TaskService {
  async findAll(filters: TaskFilters = {}) {
    const statusFilter = filters.status
      ? { in: filters.status.split(',').map((s) => s.trim()) }
      : undefined

    return prisma.task.findMany({
      where: {
        ...(statusFilter  && { status: statusFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    })
  }

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: { project: true },
    })
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        title:       input.title,
        description: input.description,
        priority:    input.priority ?? 'medium',
        dueDate:     input.dueDate ? new Date(input.dueDate) : undefined,
        projectId:   input.projectId,
      },
    })
    serverEventBus.publish(ServerEvents.TASK_CREATED, task)
    return task
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...input,
        // Converte string ISO para Date quando presente
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      },
    })
    serverEventBus.publish(ServerEvents.TASK_UPDATED, task)
    return task
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } })
    serverEventBus.publish(ServerEvents.TASK_DELETED, { id })
  }
}

export const taskService = new TaskService()
