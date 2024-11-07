FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./

RUN npm install --only=production
COPY --from=base /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/src/main.js"]
