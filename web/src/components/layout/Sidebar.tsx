import type { ComponentType } from 'react'

import { Bell, Boxes, Layers, LayoutList, Network } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Pods', to: '/pods', icon: Boxes },
  { label: 'Nodes', to: '/nodes', icon: Network },
  { label: 'Deployments', to: '/deployments', icon: Layers },
  { label: 'Namespaces', to: '/namespaces', icon: LayoutList },
  { label: 'Events', to: '/events', icon: Bell },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Boxes className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">KubeZen</div>
          <div className="text-xs text-muted-foreground">v1.0.0</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
