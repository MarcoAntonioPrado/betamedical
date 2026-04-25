/**
 * Automation Engine
 *
 * Escuta eventos do ServerEventBus e executa workflows automatizados.
 * Adicione novas automações chamando `automationEngine.register(...)` antes
 * de `automationEngine.start()` em src/index.ts.
 */

import { serverEventBus, ServerEvents, type ServerEvent } from '../events/EventBus'

type AutomationAction = (data: unknown) => Promise<void> | void

interface Automation {
  id: string
  name: string
  trigger: ServerEvent
  action: AutomationAction
  enabled: boolean
}

class AutomationEngine {
  private readonly automations = new Map<string, Automation>()
  private readonly cleanups: Array<() => void> = []
  private started = false

  register(automation: Omit<Automation, 'enabled'>): void {
    if (this.started) {
      console.warn(`[AutomationEngine] Registre automações antes de start(). Ignorando: ${automation.id}`)
      return
    }
    this.automations.set(automation.id, { ...automation, enabled: true })
  }

  start(): void {
    if (this.started) return
    this.started = true

    for (const automation of this.automations.values()) {
      if (!automation.enabled) continue

      const unsubscribe = serverEventBus.subscribe(automation.trigger, async (data) => {
        try {
          await automation.action(data)
          serverEventBus.publish(ServerEvents.AUTOMATION_TRIGGERED, {
            automationId: automation.id,
            data,
          })
        } catch (err) {
          console.error(`[Automation:${automation.id}] Erro:`, err)
        }
      })

      this.cleanups.push(unsubscribe)
    }

    console.log(`[AutomationEngine] Iniciado com ${this.automations.size} automação(ões)`)
  }

  stop(): void {
    this.cleanups.forEach((fn) => fn())
    this.cleanups.length = 0
    this.started = false
  }

  list(): Automation[] {
    return Array.from(this.automations.values())
  }
}

export const automationEngine = new AutomationEngine()

// ─── Automações padrão ───────────────────────────────────────────────────────
// Adicione suas automações aqui antes de `automationEngine.start()`

automationEngine.register({
  id:      'log-project-created',
  name:    'Log: Projeto criado',
  trigger: ServerEvents.PROJECT_CREATED,
  action:  (data) => console.log('[Auto] Projeto criado:', (data as { name: string }).name),
})

automationEngine.register({
  id:      'log-task-created',
  name:    'Log: Tarefa criada',
  trigger: ServerEvents.TASK_CREATED,
  action:  (data) => console.log('[Auto] Tarefa criada:', (data as { title: string }).title),
})
