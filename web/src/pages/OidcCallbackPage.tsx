import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export default function OidcCallbackPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const completeOidc = useAuthStore((s) => s.completeOidc)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const calledRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (code && state && !calledRef.current) {
      calledRef.current = true
      void completeOidc(code, state).then(() => {
        navigate('/pods', { replace: true })
      })
    } else if (!code || !state) {
      navigate('/login', { replace: true })
    }
  }, [searchParams, completeOidc, navigate])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <PageHeader
        title={t('auth.callbackTitle', { defaultValue: 'Finishing login...' })}
        description={t('auth.callbackDescription', { defaultValue: 'Completing OIDC authentication.' })}
      />
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          {isLoading
            ? t('auth.loading', { defaultValue: 'Redirecting...' })
            : error ?? t('auth.callbackWaiting', { defaultValue: 'Waiting for provider response.' })}
        </CardContent>
      </Card>
    </div>
  )
}

