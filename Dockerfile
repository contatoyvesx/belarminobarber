FROM node:20-alpine

WORKDIR /app

# Copia tudo
COPY . .

# Ativa corepack (pnpm)
RUN corepack enable

# Instala dependências (já reduzidas após passo 1 e 2)
RUN pnpm install --frozen-lockfile

# Builda frontend + backend
RUN pnpm run build

# Expõe a porta do backend
EXPOSE 3000

# Start do servidor
CMD ["pnpm", "start"]
