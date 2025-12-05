import { useEffect } from 'react'
import { LogIn, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startOidc = useAuthStore((s) => s.startOidc)
  const loadSession = useAuthStore((s) => s.loadSession)
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    if (session) {
      navigate('/pods', { replace: true })
    }
  }, [session, navigate])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <PageHeader
        title={t('auth.loginTitle', { defaultValue: 'Sign in to KubeZen' })}
        description={t('auth.loginDescription', {
          defaultValue: 'Authenticate to access your Kubernetes dashboards.',
        })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            {t('auth.sso', { defaultValue: 'Single Sign-On' })}
          </CardTitle>
          <CardDescription>{t('auth.chooseProvider', { defaultValue: 'Use your identity provider.' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button className="gap-2" onClick={() => void startOidc()} disabled={isLoading}>
            <LogIn className="h-4 w-4" aria-hidden />
            {isLoading ? t('auth.loading', { defaultValue: 'Redirecting...' }) : t('auth.login', { defaultValue: 'Login' })}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('auth.requirement', {
              defaultValue: 'OIDC provider must be configured by the admin.',
            })}
          </p>
          <button className="hidden" onClick={clearError} aria-hidden />
        </CardContent>
      </Card>
    </div>
  )
}

