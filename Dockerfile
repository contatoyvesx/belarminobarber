FROM node:20-alpine

WORKDIR /app

RUN corepack enable

# Copia TUDO de uma vez (menos camadas = menos lixo)
COPY . .

# Instala dependências SEM cache e SEM scripts
RUN pnpm install --frozen-lockfile --ignore-scripts --no-optional

# Build
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/backend/index.js"]
