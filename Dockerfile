# Imagem do servidor do SAC (usada pelo Railway).
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY server/public ./public
EXPOSE 3000
CMD ["node", "src/index.js"]
