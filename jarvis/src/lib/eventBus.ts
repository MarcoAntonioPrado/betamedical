/**
 * EventBus frontend — desacopla componentes via publish/subscribe.
 * Permite que hooks e serviços reajam a eventos sem prop-drilling.
 */

type Handler = (data?: unknown) => void

class EventBus {
  private readonly listeners = new Map<string, Set<Handler>>()

  /** Registra um listener. Retorna função de cleanup. */
  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(data))
  }

  clear(): void {
    this.listeners.clear()
  }
}

/** Instância singleton compartilhada pela aplicação. */
export const eventBus = new EventBus()

/** Nomes de eventos tipados — evita magic strings. */
export const AppEvents = {
  PROJECT_CREATED:       'project:created',
  PROJECT_UPDATED:       'project:updated',
  PROJECT_DELETED:       'project:deleted',
  TASK_CREATED:          'task:created',
  TASK_UPDATED:          'task:updated',
  TASK_DELETED:          'task:deleted',
  AI_RESPONSE:           'ai:response',
  AUTOMATION_TRIGGERED:  'automation:triggered',
} as const

export type AppEvent = typeof AppEvents[keyof typeof AppEvents]
