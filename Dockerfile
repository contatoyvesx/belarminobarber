FROM node:20-slim

WORKDIR /app

# Copia tudo
COPY . .

# Ativa pnpm
RUN corepack enable

# Instala deps (scripts permitidos, necessário pro rollup)
RUN pnpm install --frozen-lockfile

# Build frontend + backend
RUN pnpm run build

# Porta do backend
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
