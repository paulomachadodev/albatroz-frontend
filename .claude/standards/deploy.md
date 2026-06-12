---
name: deploy
description: Deploy do frontend Angular para produção via GitHub Actions + Docker + Nginx
metadata:
  type: standard
---

# Deploy — Albatroz Frontend (Angular)

## Fluxo

```
push main → GitHub Actions (runner: infra-sv01 em 192.168.0.190)
  → ng build --configuration production
  → docker build (nginx:alpine + SPA build)
  → docker-compose.prod.yml up -d --no-deps frontend
  → nginx serve em :80
  → Cloudflare Tunnel → erp.albatrozpapelaria.com.br
```

## Dockerfile padrão

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf para SPA routing
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|ico|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

## GitHub Actions — deploy-frontend.yml

```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'angular.json'
      - 'package*.json'
      - 'Dockerfile'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t albatroz-frontend:latest .

      - name: Deploy
        run: |
          cd /opt/albatroz
          docker-compose -f docker-compose.prod.yml up -d --no-deps frontend

      - name: Health check
        run: |
          sleep 5
          curl -f http://localhost:80/ || exit 1
```

## Variáveis de ambiente

O Angular não lê variáveis de ambiente em runtime — URLs são compiladas via `environment.prod.ts`.
Ver `.claude/standards/env-vars.md` para detalhes.
