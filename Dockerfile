FROM node:18.1.0-alpine3.15
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:1.21.6-alpine
COPY --from=0 /app/build /usr/share/nginx/html
