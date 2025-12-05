import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation, { type TranslationSchema } from '@/locales/en/translation'

export const defaultNS = 'translation'

export const resources = {
  en: {
    translation: enTranslation,
  },
} as const

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['en']
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: [defaultNS],
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export type { TranslationSchema }
export default i18n

