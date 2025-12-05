## KubeZen Development Environment

Everything you need to get the app running locally (backend + frontend).

### Prerequisites
- Go 1.24+ (check with `go version`)
- Node.js 20+ and pnpm 10+ (`corepack enable`; `pnpm -v`)
- Docker (for kind) and kubectl (`kubectl version --client`)
- Optional: kind (for a local Kubernetes cluster)
- Optional: Keycloak (or any OIDC provider) if you want to test real auth

### Install dependencies
```bash
# from repo root
pnpm install         # installs web deps via workspace
go mod download      # fetch Go modules
```

### Kubernetes access
- The backend expects a kubeconfig with a current context. Default paths:
  - `KZ_KUBECONFIG=$HOME/.kube/config`
  - `KZ_KUBE_CONTEXT=kind-kubezen`
- If you need a local cluster, create one with kind and point kubeconfig to it:
  ```bash
  kind create cluster --name kubezen --config kind-config.yaml  # adjust if needed
  kubectl config use-context kind-kubezen
  ```
- Self-signed API servers: add `KZ_KUBE_INSECURE=true` **only for local dev**.

### Auth options
- **Real OIDC (default in dev script):** set issuer/client/secret/redirect.
- **Bypass for quick UI checks:** use `pnpm dev:backend:bypass` (no OIDC required).

### Environment variables (key ones)
- `KZ_ALLOWED_ORIGINS` (CORS, default `http://localhost:5173`)
- `KZ_AUTH_DEV_BYPASS` (true/false)
- `KZ_KUBECONFIG`, `KZ_KUBE_CONTEXT`, `KZ_KUBE_INSECURE`
- `KZ_AUTH_OIDC_ISSUER`, `KZ_AUTH_OIDC_CLIENT_ID`, `KZ_AUTH_OIDC_CLIENT_SECRET`, `KZ_AUTH_OIDC_REDIRECT_URL`, `KZ_AUTH_OIDC_SCOPES`
- Optional: place overrides in a local `.env` (gitignored).

### Run backend
```bash
# With OIDC (fails fast if issuer/secret missing)
pnpm dev:backend

# Or bypass auth for local-only testing
pnpm dev:backend:bypass
```
API base: `http://localhost:8080/api`

### Run frontend
```bash
pnpm dev:frontend   # Vite on http://localhost:5173 (API base is preset)
```

### Run both
```bash
pnpm dev:all        # or dev:all:bypass for no OIDC
```

### Useful checks
- `kubectl get nodes --context kind-kubezen` — verify cluster reachable
- `curl http://localhost:8080/healthz` — backend liveness
- `curl http://localhost:8080/readyz` — backend readiness (waits for informers)

### Troubleshooting
- **Stuck at "starting informer cache..."** — ensure kubeconfig/context is valid and API reachable; with self-signed certs set `KZ_KUBE_INSECURE=true`.
- **OIDC errors** — verify issuer URL is reachable, client ID/secret match provider, and redirect URL equals `http://localhost:5173/auth/callback`.
- **CORS issues** — set `KZ_ALLOWED_ORIGINS` to the frontend origin you use.

### Suggested workflow
1) Start cluster (kind) or point to an existing Kubernetes cluster.  
2) `pnpm install && go mod download`.  
3) Run `pnpm dev:backend` (or `dev:backend:bypass`) and `pnpm dev:frontend`.  
4) Open `http://localhost:5173`, log in (if OIDC), interact with the UI; check backend logs in terminal.
