## KubeZen Backend - Dev/Deploy Quickstart (Phase 1)

### Yerel Geliştirme (backend + frontend)
Önkoşullar: Go 1.24+, pnpm 10+, kubeconfig erişimi.

1) Bağımlılıkları kur
```bash
pnpm install
```

2) Backend çalıştır (auth ile)
```bash
KZ_AUTH_DEV_BYPASS=false \
KZ_ALLOWED_ORIGINS="http://localhost:5173" \
KZ_KUBECONFIG="${HOME}/.kube/config" \
KZ_KUBE_CONTEXT="kind-kubezen" \   # kendi context’inizle değiştirin
KZ_KUBE_INSECURE=true \            # sadece geçici; geçersiz sertifika için
go run ./cmd/server
```
- Varsayılan API tabanı: `http://localhost:8080/api`
- OIDC gerekiyorsa env: `KZ_AUTH_OIDC_ISSUER`, `KZ_AUTH_OIDC_CLIENT_ID`, `KZ_AUTH_OIDC_CLIENT_SECRET`, `KZ_AUTH_OIDC_REDIRECT_URL`
>- Bypass ihtiyacı olursa: `pnpm dev:backend:bypass` (yalnızca dev için)

3) Frontend çalıştır
```bash
cd web
VITE_API_BASE="http://localhost:8080/api" pnpm dev
```

### Docker Compose (local with host kubeconfig)
```bash
docker-compose up --build
```
Environment:
- `KZ_ADDRESS=:8080`
- `KZ_ALLOWED_ORIGINS=*`
- `KZ_AUTH_DEV_BYPASS=true` (disable when wiring real auth)
- `KZ_KUBECONFIG=/root/.kube/config` (mounted from `~/.kube`)

### Helm (cluster install)
```bash
helm upgrade --install kubezen ./helm/kubezen \
  --set image.repository=<your-registry>/kubezen-server \
  --set image.tag=<tag> \
  --set env.KZ_ALLOWED_ORIGINS="https://your-ui.example.com" \
  --set env.KZ_AUTH_DEV_BYPASS=false
```
Key values:
- `env.KZ_ALLOWED_ORIGINS` — CORS
- `env.KZ_AUTH_DEV_BYPASS` — disable in non-dev
- Add OIDC via extra env (e.g., `KZ_AUTH_OIDC_ISSUER`, `KZ_AUTH_OIDC_CLIENT_ID`, `KZ_AUTH_OIDC_CLIENT_SECRET`, `KZ_AUTH_OIDC_REDIRECT_URL`)

### Backend API base
- Default base path `/api`
- Auth endpoints: `/api/auth/*`
- Core endpoints: `/api/v1/pods|nodes|deployments|namespaces|events`

### OIDC ile kimlik doğrulama
- Gerekli env: `KZ_AUTH_OIDC_ISSUER`, `KZ_AUTH_OIDC_CLIENT_ID`, `KZ_AUTH_OIDC_CLIENT_SECRET`, `KZ_AUTH_OIDC_REDIRECT_URL`, (opsiyonel) `KZ_AUTH_OIDC_SCOPES`.
- Dev komutları (bypass kapalı):
  - Backend: `pnpm dev:backend` (KZ_AUTH_DEV_BYPASS=false)
  - Frontend: `pnpm dev:frontend`
- Login akışı: UI `/login` → OIDC provider → `/auth/callback` → dashboard.
- Geçici sertifika sorunu varsa: `KZ_KUBE_INSECURE=true` (yalnızca dev için).

