FROM node:20-bookworm

WORKDIR /app
COPY . .

RUN corepack enable && corepack use pnpm@10.25.0
RUN pnpm --version

RUN pnpm install --frozen-lockfile

# 🔴 ISSO É O QUE FALTAVA
RUN pnpm approve-builds --all

RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
