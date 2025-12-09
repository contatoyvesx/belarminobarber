# Barbearia Belarmino

Monorepo com frontend (site estático em React/Vite) e backend (API Express com Supabase) separados para deploy independente.

## Estrutura
- `client/`: código do frontend Vite/React.
- `server/`: código do backend Express que integra com Supabase.
- `dist/frontend`: build estático gerado pelo Vite.
- `dist/backend`: bundle do backend gerado pelo esbuild.

## Scripts principais
- `pnpm dev:frontend`: executa o Vite dev server.
- `pnpm dev:backend`: executa a API em modo dev.
- `pnpm build`: gera os artefatos de frontend e backend.
- `pnpm start:backend`: sobe apenas a API compilada em produção.

## Variáveis de ambiente
Veja `.env.example` para os valores necessários no frontend (`VITE_API_URL`) e backend (`SUPABASE_URL`, `SUPABASE_KEY`, `PORT`).

## Deploy separado
1. Execute `pnpm build` para gerar `dist/frontend` (para NGINX ou similar) e `dist/backend` (para rodar em Node/PM2).
2. Para servir a API, rode `pnpm start:backend` apontando as variáveis do Supabase.
3. Para servir o site, publique o conteúdo de `dist/frontend` em um servidor estático.
