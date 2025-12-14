FROM node:20-bookworm

WORKDIR /app

COPY . .

# Ativa e fixa pnpm correto
RUN corepack enable && corepack use pnpm@10.25.0

# Sanity check
RUN pnpm --version

# Instala deps com scripts nativos
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# Build frontend + backend
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
