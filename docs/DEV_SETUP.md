## KubeZen Development Environment

Everything you need to get the app running locally (backend + frontend).

### Prerequisites
- Go 1.24+ (check with `go version`)
- Node.js 20+ and pnpm 10+ (`corepack enable`; `pnpm -v`)
- Docker (for kind and Keycloak) and kubectl (`kubectl version --client`)
- Optional: kind (for a local Kubernetes cluster)

### Install dependencies
```bash
# from repo root
pnpm install         # installs web deps via workspace
go mod download      # fetch Go modules
```

### Kubernetes access
- The backend expects a kubeconfig with a current context. Default paths:
  - `KZ_KUBECONFIG=$HOME/.kube/config`
  - `KZ_KUBE_CONTEXT=kind-kubezen-dev`
- If you need a local cluster, create one with kind:
  ```bash
  kind create cluster --config kind-config.yaml
  kubectl config use-context kind-kubezen-dev
  ```
- Self-signed API servers: add `KZ_KUBE_INSECURE=true` **only for local dev**.

### Keycloak (OIDC Provider)

A pre-configured Keycloak image is provided with:
- Realm: `kubezen`
- Client: `kubezen-ui` (secret: `z2WCvY1g0ydE1kkq8cASAXSgL2xu5jpk`)
- Test users:
  - `developer` / `developer`
  - `admin` / `admin`

```bash
# Build the Keycloak image (one-time)
pnpm docker:keycloak:build

# Run Keycloak
pnpm docker:keycloak
```

Keycloak Admin Console: http://localhost:8081 (admin/admin)

### Environment Configuration

Environment files are used for cross-platform compatibility:
- `.env.development` - Backend Go server config
- `web/.env.development` - Frontend Vite config

These files are loaded automatically. Modify them if you need different settings.

### Run backend
```bash
pnpm dev:backend
```
API base: `http://localhost:8080/api`

### Run frontend
```bash
pnpm dev:frontend
```
Frontend: `http://localhost:5173`

### Full Development Stack
Run all services in separate terminals:
```bash
# Terminal 1: Keycloak
pnpm docker:keycloak

# Terminal 2: Backend
pnpm dev:backend

# Terminal 3: Frontend
pnpm dev:frontend
```

### Useful checks
- `kubectl get nodes --context kind-kubezen-dev` — verify cluster reachable
- `curl http://localhost:8080/healthz` — backend liveness
- `curl http://localhost:8080/readyz` — backend readiness (waits for informers)

### Troubleshooting
- **Stuck at "starting informer cache..."** — ensure kubeconfig/context is valid and API reachable; with self-signed certs set `KZ_KUBE_INSECURE=true`.
- **OIDC errors** — verify Keycloak is running on port 8081, or check issuer URL is reachable.
- **CORS issues** — set `KZ_ALLOWED_ORIGINS` to the frontend origin you use.
- **Windows env issues** — environment variables are loaded from `.env.development` files automatically.

### Suggested workflow
1. Start cluster (kind) or point to an existing Kubernetes cluster.
2. `pnpm install && go mod download`.
3. `pnpm docker:keycloak:build` (first time only).
4. Run `pnpm docker:keycloak`, `pnpm dev:backend`, and `pnpm dev:frontend` in separate terminals.
5. Open `http://localhost:5173`, log in with `developer/developer`, interact with the UI.

