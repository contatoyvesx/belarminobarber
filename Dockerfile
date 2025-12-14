FROM node:20-bookworm

WORKDIR /app

# Copia tudo
COPY . .

# Ativa pnpm na versão estável
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Instala deps COM scripts nativos liberados
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# Build frontend + backend
RUN pnpm run build

# Porta do backend
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
