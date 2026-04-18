FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Bağımlılıkları önce kopyala (katman önbelleği)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Sunucu process.env.PORT ile dinler (docker-compose ile override edilebilir)
ENV PORT=5050
EXPOSE 5050

RUN chown -R node:node /app
USER node

CMD ["node", "server.js"]
