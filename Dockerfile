# ---------------------------
# 1) Build da aplicação
# ---------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# ---------------------------
# 2) Runner (Node + Express)
# ---------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

# Copia node_modules sem devDependencies
COPY --from=builder /app/node_modules ./node_modules

# Copia todo o dist gerado (backend + frontend)
COPY --from=builder /app/dist ./dist

# Copia arquivos necessários (caso seu server use env, public, etc)
COPY package.json ./

EXPOSE 3000

# Comando que seu package.json já define
CMD ["node", "dist/index.js"]
