# Dev Assistant Local

Aplicativo desktop de produtividade para desenvolvedores, rodando 100% local — sem cloud, sem telemetria.

## Stack

| Camada          | Tecnologia                        |
|-----------------|-----------------------------------|
| Desktop         | Tauri 1.x (Rust)                  |
| Frontend        | React 18 + TypeScript + Vite      |
| Estilo          | TailwindCSS 3                     |
| Estado          | Zustand                           |
| Backend local   | Node.js + Express + TypeScript    |
| ORM             | Prisma                            |
| Banco de dados  | SQLite (arquivo local)            |

## Estrutura de pastas

```
dev-assistant-local/
├── src/                        # Frontend React
│   ├── components/
│   │   ├── layout/             # MainLayout, Sidebar, Header
│   │   └── ui/                 # Button, Card, Badge, Input, Modal
│   ├── hooks/                  # useProjects, useTasks
│   ├── lib/                    # api.ts, eventBus.ts
│   ├── pages/                  # Dashboard, Projects, Tasks
│   ├── store/                  # Zustand (useAppStore)
│   └── types/                  # Tipos TypeScript compartilhados
│
├── backend/                    # Servidor Node.js local
│   ├── prisma/
│   │   └── schema.prisma       # Modelos SQLite
│   └── src/
│       ├── automations/        # AutomationEngine (event-driven)
│       ├── db/                 # Prisma client singleton
│       ├── events/             # ServerEventBus
│       ├── routes/             # Express routers (projects, tasks)
│       └── services/
│           ├── ai/             # AIService — pronto para integração
│           ├── ProjectService.ts
│           └── TaskService.ts
│
└── src-tauri/                  # Shell Tauri (Rust)
    ├── src/main.rs
    ├── Cargo.toml
    └── tauri.conf.json
```

## Pré-requisitos

- **Node.js** >= 18
- **Rust** >= 1.70 + `cargo`
- **Tauri CLI** (instalado via `npm`)

Para instalar o Rust: https://rustup.rs

## Instalação

### 1. Clone e instale dependências

```bash
# Instala tudo de uma vez (root + backend + gera cliente Prisma + migração)
npm run setup
```

Ou manualmente:

```bash
# Dependências do frontend / Tauri
npm install

# Dependências do backend
cd backend
npm install

# Gera o Prisma Client e cria o banco SQLite
npm run db:generate
npm run db:migrate

cd ..
```

### 2. Configure o ambiente do backend

```bash
cp backend/.env.example backend/.env
```

O banco SQLite será criado automaticamente em `backend/dev.db`.

## Desenvolvimento

### Modo browser (mais rápido para iterar no UI)

```bash
npm run dev
```

Abre:
- Frontend: http://localhost:1420
- Backend:  http://localhost:3001

### Modo desktop (Tauri)

> Requer Rust instalado.

```bash
npm run dev:tauri
```

## Build

```bash
# Build do frontend apenas
npm run build

# Build do instalador desktop
npm run build:tauri
```

O instalador será gerado em `src-tauri/target/release/bundle/`.

## Banco de dados

```bash
# Abre o Prisma Studio (interface visual do banco)
cd backend && npm run db:studio

# Recriar o banco do zero
cd backend && npm run db:reset
```

## API REST (backend)

| Método | Rota                         | Descrição                          |
|--------|------------------------------|------------------------------------|
| GET    | /health                      | Health check                       |
| GET    | /api/dashboard/stats         | Estatísticas do dashboard          |
| GET    | /api/projects                | Lista todos os projetos            |
| POST   | /api/projects                | Cria projeto                       |
| PUT    | /api/projects/:id            | Atualiza projeto                   |
| DELETE | /api/projects/:id            | Remove projeto (cascade tasks)     |
| GET    | /api/projects/:id/tasks      | Lista tarefas de um projeto        |
| GET    | /api/tasks                   | Lista tarefas (com filtros)        |
| POST   | /api/tasks                   | Cria tarefa                        |
| PATCH  | /api/tasks/:id               | Atualiza tarefa                    |
| DELETE | /api/tasks/:id               | Remove tarefa                      |

## Integração com IA

A camada de IA está em `backend/src/services/ai/AIService.ts`.
Implemente a interface `AIProvider` para conectar ao provedor desejado:

```typescript
// Exemplo: Ollama (local)
class OllamaProvider implements AIProvider {
  name = 'ollama'

  async complete(messages: AIMessage[]): Promise<string> {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', messages, stream: false }),
    })
    const data = await res.json()
    return data.message.content
  }
}

// Em backend/src/index.ts:
import { aiService } from './services/ai/AIService'
aiService.setProvider(new OllamaProvider())
```

## Automações

Registre workflows em `backend/src/automations/AutomationEngine.ts`:

```typescript
automationEngine.register({
  id:      'notify-high-priority',
  name:    'Notificar tarefas urgentes',
  trigger: ServerEvents.TASK_CREATED,
  action:  (data) => {
    const task = data as Task
    if (task.priority === 'high') {
      // enviar notificação, webhook, etc.
    }
  },
})
```

## Boas práticas adotadas

- **Separação de responsabilidades**: frontend / backend / serviços / eventos
- **Tipagem estrita**: TypeScript strict em toda a base
- **Event-driven**: `EventBus` desacopla camadas (sem imports circulares)
- **Validação na fronteira**: `express-validator` valida todas as entradas da API
- **Graceful shutdown**: desconecta Prisma e para automações ao encerrar
- **CSP no Tauri**: Content-Security-Policy configurada para limitar conexões
- **Sem dependências desnecessárias**: stack enxuta e justificada
