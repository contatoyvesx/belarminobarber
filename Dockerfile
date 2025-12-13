# =========================
# STAGE 1 — BUILD
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia só o necessário primeiro (melhor cache)
COPY package.json package-lock.json* ./

# npm é mais previsível aqui
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Agora copia o resto
COPY . .

# Build frontend + backend
RUN npm run build


# =========================
# STAGE 2 — RUNTIME
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copia SOMENTE o resultado final
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/backend/index.js"]
