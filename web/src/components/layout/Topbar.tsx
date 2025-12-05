import { LogOut, Sparkles, User, Settings, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth-store'
import { useClusterStore } from '@/stores/cluster-store'

function getInitials(name: string): string {
  return name
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Topbar() {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const contexts = useClusterStore((s) => s.contexts)
  const currentContext = useClusterStore((s) => s.currentContext)

  const activeContext = contexts.find((c) => c.isCurrent) ?? contexts[0]

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/70 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Label className="text-xs uppercase text-muted-foreground">{t('app.cluster')}</Label>
        {session && contexts.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="font-medium">{currentContext ?? activeContext?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>
                {t('app.availableContexts', { defaultValue: 'Available Contexts' })}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {contexts.map((ctx) => (
                <DropdownMenuItem key={ctx.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{ctx.name}</span>
                    <span className="text-xs text-muted-foreground">{ctx.cluster}</span>
                  </div>
                  {ctx.isCurrent && <Check className="h-4 w-4 text-green-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : session ? (
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium">{currentContext ?? 'Connected'}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('app.notConnected', { defaultValue: 'Not connected' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('app.newAction')}
        </Button>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-black text-white">
                    {getInitials(session.subject)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.subject}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.source === 'oidc' ? 'OpenID Connect' : 'Kubeconfig'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>{t('auth.profile', { defaultValue: 'Profile' })}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('auth.settings', { defaultValue: 'Settings' })}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.logout', { defaultValue: 'Logout' })}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" aria-hidden />
            {t('auth.login', { defaultValue: 'Login' })}
          </Button>
        )}
      </div>
    </header>
  )
}
