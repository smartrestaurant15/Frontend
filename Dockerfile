# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Run stage
FROM nginx:alpine
# Copy the build output to replace the default nginx contents.
# Note: Check angular.json for the correct output path. It's dist/smart-restaurante
COPY --from=build /app/dist/smart-restaurante /usr/share/nginx/html
# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
