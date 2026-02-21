const fallbackSupportEmail = 'support@tasky.app'

export const LEGAL_EFFECTIVE_DATE = 'February 21, 2026'
export const APP_NAME = 'Tasky'
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || fallbackSupportEmail

export function getPublicAppUrl() {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin
}

export function legalMailto(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}
