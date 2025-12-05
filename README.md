# KubeZen

> Modern Kubernetes Dashboard - Phase 1 MVP

A lightweight, developer-friendly Kubernetes dashboard built with Go and React.

## Features

- 🔐 **Flexible Authentication**
  - Local username/password (with setup wizard)
  - OpenID Connect (Keycloak, etc.)
  - Kubeconfig upload

- 📊 **Resource Management**
  - Pods, Deployments, Nodes, Namespaces
  - Real-time updates via Kubernetes informers
  - Events timeline

- 🎨 **Modern UI**
  - Dark/light theme
  - Responsive design
  - Built with shadcn/ui

## Quick Start

### Prerequisites

- Go 1.23+
- Node.js 20+
- pnpm
- Kubernetes cluster (kind, minikube, or remote)

### Development

```bash
# Install dependencies
pnpm install

# Start backend (uses kubeconfig from ~/.kube/config)
pnpm dev:backend

# Start frontend (separate terminal)
pnpm dev:frontend
```

Open http://localhost:5173

### First Run

On first launch, you'll be prompted to create an admin account. No external auth provider required!

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Go, Gin, client-go |
| Frontend | React, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Auth | Sessions, OIDC, bcrypt |
| Database | SQLite (embedded) |

## Project Structure

```
├── cmd/server/          # Go entrypoint
├── internal/
│   ├── api/             # HTTP handlers
│   ├── auth/            # Session management
│   ├── k8s/             # Kubernetes client
│   └── store/           # SQLite user store
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   └── stores/      # Zustand stores
└── docker/              # Docker configs
```

## Configuration

Environment variables (`.env.development`):

```bash
# Kubernetes
KZ_KUBE_CONTEXT=kind-kubezen-dev

# Auth
KZ_AUTH_DEV_BYPASS=false
KZ_AUTH_SESSION_SECRET=your-secret-key

# OIDC (optional)
KZ_AUTH_OIDC_ISSUER=http://localhost:8180/realms/kubezen
KZ_AUTH_OIDC_CLIENT_ID=kubezen-local
```

## License

MIT
