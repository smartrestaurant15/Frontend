# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration docker

# Run stage
FROM nginx:alpine

# Install envsubst (comes with gettext)
RUN apk add --no-cache gettext

# Copy Angular build output
COPY --from=build /app/dist/smart-restaurante /usr/share/nginx/html

# Copy nginx template (BACKEND_URL gets substituted at container start)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Startup script: substitute env vars then launch nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
