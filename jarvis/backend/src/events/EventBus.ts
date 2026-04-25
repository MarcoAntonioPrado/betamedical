import { EventEmitter } from 'events'

/** Eventos tipados do servidor — evita magic strings. */
export const ServerEvents = {
  PROJECT_CREATED:      'project:created',
  PROJECT_UPDATED:      'project:updated',
  PROJECT_DELETED:      'project:deleted',
  TASK_CREATED:         'task:created',
  TASK_UPDATED:         'task:updated',
  TASK_DELETED:         'task:deleted',
  AI_REQUEST:           'ai:request',
  AI_RESPONSE:          'ai:response',
  AUTOMATION_TRIGGERED: 'automation:triggered',
} as const

export type ServerEvent = typeof ServerEvents[keyof typeof ServerEvents]

class ServerEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  publish(event: ServerEvent, data?: unknown): void {
    this.emit(event, data)
  }

  /** Retorna função de unsubscribe. */
  subscribe(event: ServerEvent, handler: (data: unknown) => void): () => void {
    this.on(event, handler)
    return () => this.off(event, handler)
  }
}

/** Instância singleton do event bus do servidor. */
export const serverEventBus = new ServerEventBus()
