/**
 * AI Service — camada de integração com provedores de IA.
 *
 * Atualmente usa um StubProvider que retorna mensagens de placeholder.
 * Para habilitar IA real, implemente a interface AIProvider e chame
 * `aiService.setProvider(new MeuProvider())` em src/index.ts.
 *
 * Provedores recomendados:
 *   - Ollama  (local, gratuito) — https://ollama.com
 *   - OpenAI  (API)             — npm install openai
 *   - Anthropic Claude (API)    — npm install @anthropic-ai/sdk
 *   - LM Studio (local)         — compatível com API OpenAI
 */

import { serverEventBus, ServerEvents } from '../../events/EventBus'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  name: string
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string>
}

// ─── Stub provider (padrão) ──────────────────────────────────────────────────

class StubAIProvider implements AIProvider {
  readonly name = 'stub'

  async complete(messages: AIMessage[]): Promise<string> {
    const last = messages.findLast((m) => m.role === 'user')?.content ?? ''
    return (
      `[IA não configurada] Você perguntou: "${last.slice(0, 80)}". ` +
      `Configure um provider real em backend/src/services/ai/AIService.ts.`
    )
  }
}

// ─── AI Service ──────────────────────────────────────────────────────────────

export class AIService {
  private provider: AIProvider = new StubAIProvider()
  private history: AIMessage[] = []

  setProvider(provider: AIProvider): void {
    this.provider = provider
    console.log(`[AIService] Provider configurado: ${provider.name}`)
  }

  getProviderName(): string {
    return this.provider.name
  }

  /** Envia uma mensagem e retorna a resposta do assistente. */
  async chat(userMessage: string, options?: AICompletionOptions): Promise<string> {
    this.history.push({ role: 'user', content: userMessage })

    const response = await this.provider.complete(
      [
        {
          role: 'system',
          content:
            'Você é um assistente de desenvolvimento de software. ' +
            'Seja conciso, técnico e direto ao ponto.',
        },
        ...this.history,
      ],
      options,
    )

    this.history.push({ role: 'assistant', content: response })
    serverEventBus.publish(ServerEvents.AI_RESPONSE, { response })

    return response
  }

  /** Envia código para análise. */
  async analyzeCode(code: string, language: string): Promise<string> {
    return this.chat(
      `Analise o seguinte código ${language} e aponte possíveis melhorias:\n\`\`\`${language}\n${code}\n\`\`\``,
    )
  }

  clearHistory(): void {
    this.history = []
  }
}

export const aiService = new AIService()
