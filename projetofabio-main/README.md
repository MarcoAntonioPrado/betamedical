# AtlasMed Beta

Versão beta genérica de um sistema de gestão de equipamentos médicos, refeita em monorepo com separação clara entre frontend e backend.

## Estrutura

```
frontend/  -> React + Vite para Vercel
backend/   -> Express + Firebase Admin para Render
shared/    -> tipos, módulos, seeds e regras compartilhadas
```

## Modos de operação

- `demo`: usa o backend com base local em JSON para apresentação sem tocar no Firebase.
- `firebase`: usa Firebase novo via Admin SDK no backend e Firebase Auth no frontend.

## Scripts

Na raiz:

```bash
npm install
npm run build
npm run dev:backend
npm run dev:frontend
npm run dev:shared
```

## Credenciais demo

- `admin@atlasmed.demo` / `Atlas123!`
- `tecnico@atlasmed.demo` / `Atlas123!`
- `operacao@atlasmed.demo` / `Atlas123!`

## Configuração

1. Copie `backend/.env.example` para `backend/.env`.
2. Copie `frontend/.env.example` para `frontend/.env`.
3. Para trabalhar sem Firebase novo, mantenha `APP_MODE=demo` no backend e `VITE_APP_MODE=demo` no frontend.
4. Para ativar o ambiente novo, troque ambos para `firebase` e preencha as credenciais do seu novo projeto Firebase.

## Deploy

- Render: use o serviço `backend` com build `npm install && npm run build --workspace shared && npm run build --workspace backend` e start `npm run start --workspace backend`.
- Vercel: publique a pasta `frontend` com build `npm run build --workspace shared && npm run build --workspace frontend`.

## Observação

Esta pasta foi desvinculada do sistema antigo no nível local. O banco antigo e o repositório original não são usados por este beta.
