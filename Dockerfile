FROM node:20-alpine

WORKDIR /app

# Copia tudo de uma vez (menos camadas)
COPY . .

# Remove pnpm da equação (ele estoura disco)
RUN rm -rf node_modules .pnpm-store

# Usa npm (menos IO, menos temp, menos lixo)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Build frontend + backend
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/backend/index.js"]
