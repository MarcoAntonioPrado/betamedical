import { Router, type Request, type Response, type NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { taskService } from '../services/TaskService'

export const tasksRouter = Router()

function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
tasksRouter.get('/', async (req, res) => {
  try {
    const { status, projectId, limit } = req.query as Record<string, string | undefined>
    const tasks = await taskService.findAll({
      status,
      projectId,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
    res.json(tasks)
  } catch {
    res.status(500).json({ message: 'Falha ao buscar tarefas' })
  }
})

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
tasksRouter.get(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      const task = await taskService.findById(req.params['id']!)
      if (!task) {
        res.status(404).json({ message: 'Tarefa não encontrada' })
        return
      }
      res.json(task)
    } catch {
      res.status(500).json({ message: 'Falha ao buscar tarefa' })
    }
  },
)

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
tasksRouter.post(
  '/',
  body('title').isString().trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').optional().isString().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('projectId').isString().notEmpty().withMessage('projectId é obrigatório'),
  validate,
  async (req, res) => {
    try {
      const task = await taskService.create(req.body as { title: string; projectId: string; description?: string; priority?: string; dueDate?: string })
      res.status(201).json(task)
    } catch {
      res.status(500).json({ message: 'Falha ao criar tarefa' })
    }
  },
)

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
tasksRouter.patch(
  '/:id',
  param('id').isString().notEmpty(),
  body('title').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  validate,
  async (req, res) => {
    try {
      const task = await taskService.update(req.params['id']!, req.body as Record<string, string>)
      res.json(task)
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        res.status(404).json({ message: 'Tarefa não encontrada' })
        return
      }
      res.status(500).json({ message: 'Falha ao atualizar tarefa' })
    }
  },
)

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
tasksRouter.delete(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      await taskService.delete(req.params['id']!)
      res.status(204).end()
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        res.status(404).json({ message: 'Tarefa não encontrada' })
        return
      }
      res.status(500).json({ message: 'Falha ao excluir tarefa' })
    }
  },
)
