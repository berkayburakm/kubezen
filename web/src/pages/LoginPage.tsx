import { useEffect, useState } from 'react'
import { Boxes, LogIn, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const authStatus = useAuthStore((s) => s.authStatus)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const localLogin = useAuthStore((s) => s.localLogin)
  const startOidc = useAuthStore((s) => s.startOidc)
  const loadSession = useAuthStore((s) => s.loadSession)
  const checkSetup = useAuthStore((s) => s.checkSetup)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    void loadSession()
    void checkSetup()
  }, [loadSession, checkSetup])

  useEffect(() => {
    if (session) {
      navigate('/pods', { replace: true })
    }
  }, [session, navigate])

  useEffect(() => {
    if (authStatus?.needsSetup) {
      navigate('/setup', { replace: true })
    }
  }, [authStatus, navigate])

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await localLogin(username, password)
      navigate('/pods', { replace: true })
    } catch {
      // Error handled by store
    }
  }

  const oidcEnabled = authStatus?.authMethods.includes('oidc') ?? false

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Boxes className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.loginTitle', { defaultValue: 'Sign in to KubeZen' })}
          </CardTitle>
          <CardDescription>
            {t('auth.loginDescription', {
              defaultValue: 'Enter your credentials to access your Kubernetes clusters.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleLocalLogin(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {oidcEnabled && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t('auth.or', { defaultValue: 'Or continue with' })}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => void startOidc()}
                disabled={isLoading}
              >
                {t('auth.ssoButton', { defaultValue: 'Single Sign-On (SSO)' })}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
