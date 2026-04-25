import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { projectsRouter } from './routes/projects'
import { tasksRouter } from './routes/tasks'
import { projectService } from './services/ProjectService'
import { automationEngine } from './automations/AutomationEngine'
import { prisma } from './db/prisma'

const PORT = parseInt(process.env['PORT'] ?? '3001', 10)

async function main() {
  const app = express()

  // ─── Middlewares globais ──────────────────────────────────────────────────
  app.use(
    cors({
      // Aceita o frontend Vite (dev) e o protocolo custom do Tauri (produção)
      origin: ['http://localhost:1420', 'tauri://localhost', 'https://tauri.localhost'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT })
  })

  // ─── Dashboard ────────────────────────────────────────────────────────────
  app.get('/api/dashboard/stats', async (_req, res) => {
    try {
      const stats = await projectService.getStats()
      res.json(stats)
    } catch {
      res.status(500).json({ message: 'Falha ao buscar estatísticas' })
    }
  })

  // ─── Rotas de domínio ─────────────────────────────────────────────────────
  app.use('/api/projects', projectsRouter)
  app.use('/api/tasks', tasksRouter)

  // ─── 404 ──────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' })
  })

  // ─── Error handler ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message)
    res.status(500).json({ message: 'Erro interno do servidor' })
  })

  // ─── Automações ───────────────────────────────────────────────────────────
  automationEngine.start()

  // ─── Start ────────────────────────────────────────────────────────────────
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[Backend] ✓ Rodando em http://localhost:${PORT}`)
    console.log(`[Backend] ✓ Banco: ${process.env['DATABASE_URL']}`)
  })

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[Backend] ${signal} recebido. Encerrando...`)
    automationEngine.stop()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err: unknown) => {
  console.error('[Backend] Erro fatal:', err)
  process.exit(1)
})
