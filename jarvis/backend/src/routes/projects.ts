import { Router, type Request, type Response, type NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { projectService } from '../services/ProjectService'
import { taskService } from '../services/TaskService'

export const projectsRouter = Router()

// Middleware de validação compartilhado
function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

// ─── GET /api/projects ────────────────────────────────────────────────────────
projectsRouter.get('/', async (req, res) => {
  try {
    const limit = req.query['limit'] ? Number(req.query['limit']) : undefined
    const projects = await projectService.findAll(limit)
    res.json(projects)
  } catch {
    res.status(500).json({ message: 'Falha ao buscar projetos' })
  }
})

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
projectsRouter.get(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      const project = await projectService.findById(req.params['id']!)
      if (!project) {
        res.status(404).json({ message: 'Projeto não encontrado' })
        return
      }
      res.json(project)
    } catch {
      res.status(500).json({ message: 'Falha ao buscar projeto' })
    }
  },
)

// ─── POST /api/projects ───────────────────────────────────────────────────────
projectsRouter.post(
  '/',
  body('name').isString().trim().notEmpty().withMessage('Nome é obrigatório'),
  body('description').optional().isString().trim(),
  body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Cor inválida'),
  validate,
  async (req, res) => {
    try {
      const project = await projectService.create(req.body as { name: string; description?: string; color?: string })
      res.status(201).json(project)
    } catch {
      res.status(500).json({ message: 'Falha ao criar projeto' })
    }
  },
)

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
projectsRouter.put(
  '/:id',
  param('id').isString().notEmpty(),
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('status').optional().isIn(['active', 'archived', 'completed']),
  body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  validate,
  async (req, res) => {
    try {
      const project = await projectService.update(req.params['id']!, req.body as Record<string, string>)
      res.json(project)
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        res.status(404).json({ message: 'Projeto não encontrado' })
        return
      }
      res.status(500).json({ message: 'Falha ao atualizar projeto' })
    }
  },
)

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
projectsRouter.delete(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      await projectService.delete(req.params['id']!)
      res.status(204).end()
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        res.status(404).json({ message: 'Projeto não encontrado' })
        return
      }
      res.status(500).json({ message: 'Falha ao excluir projeto' })
    }
  },
)

// ─── GET /api/projects/:id/tasks ──────────────────────────────────────────────
projectsRouter.get(
  '/:id/tasks',
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      const tasks = await taskService.findAll({ projectId: req.params['id']! })
      res.json(tasks)
    } catch {
      res.status(500).json({ message: 'Falha ao buscar tarefas do projeto' })
    }
  },
)
