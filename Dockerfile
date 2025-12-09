# ---------------------------
# 1) Build da aplicação
# ---------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Remove devDependencies para a imagem final
RUN pnpm prune --prod

# ---------------------------
# 2) Runner (Node + Express API)
# ---------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable
ENV NODE_ENV=production

# Copia apenas o necessário para executar em produção
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

# Comando que seu package.json já define
CMD ["node", "dist/backend/index.js"]
