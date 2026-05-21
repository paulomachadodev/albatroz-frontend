# Stage 1: Build Angular app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine
RUN apk add --no-cache curl

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist/albatroz-frontend/browser /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/index.html || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
